'use strict';

const is = require('is_js');
const mongoose = require('../../models');

const JobModel = mongoose.model('Job');

class Controller {
    static async list(req, res) {
        try {
            let page = parseInt(res.locals.$qs.val('page'));
            page = is.not.number(page) ? 0 : Math.abs(page);
            const query = {};
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

            await job.remove();
            // TODO: remove postscript file
        } catch (e) {
            req.log.error(e.message);
            req.flash('danger', res.__('txt.e500'));
        }
        res.redirect(`/${ res.locals.$module }?ts=${ res.locals.$qs.val('ts') }`);
    }
}

module.exports = Controller;
