'use strict';

const CUIRegistration = require('../../lib/eip/cui-registration');
const is = require('is_js');
const mongoose = require('../../models');

const Model = mongoose.model('Model');
const PrinterModel = mongoose.model('Printer');

class Controller {
    static async list(req, res) {
        try {
            let page = parseInt(res.locals.$qs.val('page'));
            page = is.not.number(page) ? 0 : Math.abs(page);
            const query = {};
            const printers = await PrinterModel.paginate(query, page);
            res.render(`${ res.locals.$module }/index`, {
                printers: is.array(printers) ? printers : [],
                page
            });
        } catch (e) {
            req.log.error(e.message);
            req.flash('danger', res.__('txt.e500'));
            res.redirect(`/?ts=${ res.locals.$qs.val('ts') }`);
        }
    }

    static async create(req, res) {
        try {
            let models = await Model.paginate({ }, -1, 'brand model');
            if (is.not.array(models)) models = [];
            if (req.method === 'GET') return res.render(`${ res.locals.$module }/form`, { printer: null, models });

            if (res.locals.$license && res.locals.$license.printers) {
                const count = await PrinterModel.count({});
                if (is.not.number(count) || res.locals.$license.printers <= count) throw new Error('LICENSE');
            }

            if (is.not.string(req.body.name) || is.empty(req.body.name)) throw new Error('NAME_REQUIRED');
            if (is.not.string(req.body.ip) || is.empty(req.body.ip)) throw new Error('IP_REQUIRED');

            const printer = new PrinterModel({ ip: req.body.ip, name: req.body.name });
            if (mongoose.Types.ObjectId.isValid(req.body.model)) {
                const pm = Model.single({ _id: mongoose.Types.ObjectId(req.body.model) });
                if (pm) printer.model = pm._id;
            }
            printer.options = { location: req.body.location || '' };
            await printer.save();
            res.redirect(`/${ res.locals.$module }/${ printer.id }/edit?ts=${ res.locals.$qs.val('ts') }`);
        } catch (e) {
            req.log.error(e.message);
            switch (e.message) {
            case 'NAME_REQUIRED':
                req.flash('danger', res.__('txt.name'));
                break;
            case 'IP_REQUIRED':
                req.flash('danger', res.__('txt.ip'));
                break;
            case 'LICENSE':
                req.flash('danger', res.__('txt.license.printers'));
                break;
            default:
                req.flash('danger', res.__('txt.e500'));
            }
            res.redirect(`/${ res.locals.$module }/create?ts=${ res.locals.$qs.val('ts') }`);
        }
    }

    static async edit(req, res) {
        try {
            if (!mongoose.Types.ObjectId.isValid(req.params.id))
                return res.redirect(`/${ res.locals.$module }?ts=${ res.locals.$qs.val('ts') }`);

            let models = await Model.paginate({ }, -1, 'brand model');
            if (is.not.array(models)) models = [];
            const printer = await PrinterModel.single({ _id: mongoose.Types.ObjectId(req.params.id) });
            if (!printer) return res.redirect(`/${ res.locals.$module }?ts=${ res.locals.$qs.val('ts') }`);
            else if (req.method === 'POST') {
                if (!printer.options) printer.options = {};
                if (is.string(req.body.name) && is.not.empty(req.body.name)) printer.name = req.body.name;
                if (is.string(req.body.ip) && is.not.empty(req.body.ip)) printer.ip = req.body.ip;
                if (is.string(req.body.location)) printer.options.location = req.body.location;
                if (mongoose.Types.ObjectId.isValid(req.body.model)) {
                    const pm = await Model.single({ _id: mongoose.Types.ObjectId(req.body.model) });
                    if (pm) printer.model = pm._id;
                } else printer.model = undefined;
                printer.markModified('options');
                await printer.save();
                res.redirect(`/${ res.locals.$module }/${ req.params.id }/edit?ts=${ res.locals.$qs.val('ts') }`);
            } else res.render(`${ res.locals.$module }/form`, { printer, models });
        } catch (e) {
            req.log.error(e.message);
            req.flash('danger', res.__('txt.e500'));
            res.redirect(`/${ res.locals.$module }/${ req.params.id }/edit?ts=${ res.locals.$qs.val('ts') }`);
        }
    }

    static async manage(req, res) {
        try {
            if (!mongoose.Types.ObjectId.isValid(req.params.id))
                return res.redirect(`/${ res.locals.$module }?ts=${ res.locals.$qs.val('ts') }`);

            const printer = await PrinterModel.single({ _id: mongoose.Types.ObjectId(req.params.id) });
            if (!printer) return res.redirect(`/${ res.locals.$module }?ts=${ res.locals.$qs.val('ts') }`);
            res.render(`${ res.locals.$module }/manage`, { printer });
        } catch (e) {
            req.log.error(e.message);
            req.flash('danger', res.__('txt.e500'));
            res.redirect(`/${ res.locals.$module }/${ req.params.id }/manage?ts=${ res.locals.$qs.val('ts') }`);
        }
    }

    static async apps(req, res) {
        try {
            if (!mongoose.Types.ObjectId.isValid(req.params.id))
                throw new Error('invalid printer id');

            const printer = await PrinterModel.single({ _id: mongoose.Types.ObjectId(req.params.id) });
            if (!printer) throw new Error('printer not found');

            const register = new CUIRegistration(printer.ip, printer.options ? printer.options.https : false);
            await register.create();
            const apps = await register.list({ password: req.body.password, username: req.body.username });
            res.json(apps);
        } catch (e) {
            res.json({ e: e.message });
        }
    }

    static async status(req, res, status) {
        try {
            if (!mongoose.Types.ObjectId.isValid(req.params.id))
                res.redirect(`/${ res.locals.$module }?ts=${ res.locals.$qs.val('ts') }`);

            const printer = await PrinterModel.single({ _id: mongoose.Types.ObjectId(req.params.id) });
            if (!printer) return res.redirect(`/${ res.locals.$module }?ts=${ res.locals.$qs.val('ts') }`);

            if (status) await printer.restore();
            else await printer.delete();
            res.redirect(`/${ res.locals.$module }/${ printer.id }/edit?ts=${ res.locals.$qs.val('ts') }`);
        } catch (e) {
            req.log.error(e.message);
            req.flash('danger', res.__('txt.e500'));
            res.redirect(`/${ res.locals.$module }?ts=${ res.locals.$qs.val('ts') }`);
        }
    }
}

module.exports = Controller;
