'use strict';

const auth = require('../../lib/auth');
const is = require('is_js');
const mongoose = require('../../models');

const SettingModel = mongoose.model('Setting');

class Controller {
    static async list(req, res) {
        try {
            const settings = await SettingModel.paginate({}, -1, 'name');
            res.render(`${ res.locals.$module }/index`, {
                settings: is.array(settings) ? settings : []
            });
        } catch (e) {
            req.log.error(e.message);
            req.flash('danger', res.__('txt.e500'));
            res.redirect(`/?ts=${ res.locals.$qs.val('ts') }`);
        }
    }

    static async create(req, res) {
        try {
            if (req.method === 'GET') return res.render(`${ res.locals.$module }/form`, { setting: null, value: {} });

            if (is.not.string(req.body.name) || is.empty(req.body.name)) throw new Error('NAME_REQUIRED');
            req.body.value = JSON.parse(req.body.value);
            if (is.not.object(req.body.value) || is.empty(req.body.value)) throw new Error('invalid value');

            const setting = new SettingModel({ name: req.body.name });
            setting.value = auth.sign(req.body.value);
            await setting.save();
            res.redirect(`/${ res.locals.$module }/${ setting.id }/edit?ts=${ res.locals.$qs.val('ts') }`);
        } catch (e) {
            req.log.error(e.message);
            switch (e.message) {
            case 'NAME_REQUIRED':
                req.flash('danger', res.__('txt.name'));
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

            const setting = await SettingModel.single({ _id: mongoose.Types.ObjectId(req.params.id) });
            if (!setting) return res.redirect(`/${ res.locals.$module }?ts=${ res.locals.$qs.val('ts') }`);
            else if (setting.name === 'license')
                return res.redirect(`/${ res.locals.$module }/license?ts=${ res.locals.$qs.val('ts') }`);
            else if (setting.name === 'prices')
                return res.redirect(`/${ res.locals.$module }/prices?ts=${ res.locals.$qs.val('ts') }`);


            let value = auth.verify(setting.value);
            if (!value) value = {};
            if (value.iat) delete value.iat;
            if (req.method === 'POST' && is.string(req.body.value) && is.not.empty(req.body.value)) {
                req.body.value = JSON.parse(req.body.value);
                if (is.not.object(req.body.value) || is.empty(req.body.value)) throw new Error('invalid value');

                if (!req.body.value.password && value.password) req.body.value.password = value.password;
                setting.value = auth.sign(req.body.value);
                await setting.save();
                res.redirect(`/${ res.locals.$module }/${ req.params.id }/edit?ts=${ res.locals.$qs.val('ts') }`);
            } else {
                if (value.password) delete value.password;
                res.render(`${ res.locals.$module }/form`, { setting, value });
            }
        } catch (e) {
            req.log.error(e.message);
            req.flash('danger', res.__('txt.e500'));
            res.redirect(`/${ res.locals.$module }/${ req.params.id }/edit?ts=${ res.locals.$qs.val('ts') }`);
        }
    }

    static async license(req, res) {
        try {
            let setting = await SettingModel.single({ name: 'license' });
            if (req.method === 'POST') {
                if (is.not.string(req.body.license) || is.empty(req.body.license)) throw new Error('invalid license');

                if (!setting) setting = new SettingModel({ name: 'license', keep: true });
                else setting.increment();
                setting.value = req.body.license.trim();
                await setting.save();
                res.redirect(`/${ res.locals.$module }/license?ts=${ res.locals.$qs.val('ts') }`);
            } else res.render(`${ res.locals.$module }/license`, { setting });
        } catch (e) {
            req.log.error(e.message);
            req.flash('danger', res.__('txt.e500'));
            res.redirect(`/${ res.locals.$module }/license?ts=${ res.locals.$qs.val('ts') }`);
        }
    }

    static async prices(req, res) {
        const papers = [ 'A3', 'A4', 'A5', 'LETTER' ];
        try {
            let setting = await SettingModel.single({ name: 'prices' }), value;
            if (req.method === 'POST') {
                if (is.empty(req.body)) throw new Error('invalid values');

                if (!setting) setting = new SettingModel({ name: 'prices', keep: true });
                else setting.increment();
                for (let field in req.body) {
                    req.body[field] = Math.abs(parseFloat(req.body[field]));
                    if (is.not.number(req.body[field])) req.body[field] = 0;
                }
                setting.value = auth.sign(req.body);
                await setting.save();
                res.redirect(`/${ res.locals.$module }/prices?ts=${ res.locals.$qs.val('ts') }`);
            } else {
                if (setting) value = auth.verify(setting.value);
                if (!value) value = {};
                if (value.iat) delete value.iat;
                res.render(`${ res.locals.$module }/prices`, { value, papers });
            }
        } catch (e) {
            req.log.error(e.message);
            req.flash('danger', res.__('txt.e500'));
            res.redirect(`/${ res.locals.$module }?ts=${ res.locals.$qs.val('ts') }`);
        }
    }

    static async remove(req, res) {
        try {
            if (!mongoose.Types.ObjectId.isValid(req.params.id))
                res.redirect(`/${ res.locals.$module }?ts=${ res.locals.$qs.val('ts') }`);

            const setting = await SettingModel.single({ _id: mongoose.Types.ObjectId(req.params.id) });
            if (!setting) return res.redirect(`/${ res.locals.$module }?ts=${ res.locals.$qs.val('ts') }`);

            if (!setting.keep) await setting.remove();
        } catch (e) {
            req.log.error(e.message);
            req.flash('danger', res.__('txt.e500'));
        }
        res.redirect(`/${ res.locals.$module }?ts=${ res.locals.$qs.val('ts') }`);
    }
}

module.exports = Controller;
