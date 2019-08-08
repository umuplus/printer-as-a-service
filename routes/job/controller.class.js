'use strict';

const { accessSync: access, constants, existsSync: exists, unlinkSync: unlink } = require('fs');
const Configuration = require('../../lib/config');
const is = require('is_js');
const mongoose = require('../../models');

const JobModel = mongoose.model('Job');

class Controller {
    static async list(req, res) {
        try {
            let page = parseInt(res.locals.$qs.val('page'));
            page = is.not.number(page) ? 0 : Math.abs(page);
            const query = {};
            if (!res.locals.$user.level) query.user = res.locals.$user._id;
            const jobs = await JobModel.paginate(query, page);
            res.render(`${ res.locals.$module }/index`, {
                jobs: is.array(jobs) ? jobs : [],
                page
            });
        } catch (e) {
            req.log.error(e.message);
            req.flash('danger', res.__('txt.e500'));
            res.redirect(`/?ts=${ res.locals.$qs.val('ts') }`);
        }
    }

    static async remove(req, res) {
        try {
            if (!mongoose.Types.ObjectId.isValid(req.params.id))
                res.redirect(`/${ res.locals.$module }?ts=${ res.locals.$qs.val('ts') }`);

            const job = await JobModel.single({ _id: mongoose.Types.ObjectId(req.params.id) });
            if (!job) return res.redirect(`/${ res.locals.$module }?ts=${ res.locals.$qs.val('ts') }`);

            const printer = await Configuration.printer({});
            if (is.not.string(printer.folder) || !exists(printer.folder) || access(printer.folder, constants.W_OK))
                throw new Error('invalid folder');

            if (!printer.folder.endsWith('/')) printer.folder = `${ printer.folder }/`;
            const ps = `${ printer.folder }spool/${ job.id }.ps`;
            if (exists(ps)) unlink(ps);
            await job.remove();
        } catch (e) {
            req.log.error(e.message);
            req.flash('danger', res.__('txt.e500'));
        }
        res.redirect(`/${ res.locals.$module }?ts=${ res.locals.$qs.val('ts') }`);
    }
}

module.exports = Controller;
