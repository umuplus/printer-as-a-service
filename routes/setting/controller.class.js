'use strict';

const auth = require('../../lib/auth');
const is = require('is_js');
const mongoose = require('../../models');

const SettingModel = mongoose.model('Setting');

class Controller {
    static async list(req, res) {
        try {
            const settings = await SettingModel.paginate({}, -1);
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

            const setting = new SettingModel({ name: req.body.name });
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

            if (req.method === 'POST' && is.string(req.body.value) && is.not.empty(req.body.value)) {
                req.body.value = JSON.parse(req.body.value);
                if (is.not.object(req.body.value) || is.empty(req.body.value)) throw new Error('invalid value');

                setting.value = auth.sign(req.body.value);
                await setting.save();
            }

            let value = auth.verify(setting.value);
            if (!value) value = {};
            if (value.iat) delete value.iat;
            res.render(`${ res.locals.$module }/form`, { setting, value });
        } catch (e) {
            req.log.error(e.message);
            req.flash('danger', res.__('txt.e500'));
            res.redirect(`/${ res.locals.$module }/${ req.params.id }/edit?ts=${ res.locals.$qs.val('ts') }`);
        }
    }

    static async remove(req, res) {
        try {
            if (!mongoose.Types.ObjectId.isValid(req.params.id))
                res.redirect(`/${ res.locals.$module }?ts=${ res.locals.$qs.val('ts') }`);

            const setting = await SettingModel.single({ _id: mongoose.Types.ObjectId(req.params.id) });
            if (!setting) return res.redirect(`/${ res.locals.$module }?ts=${ res.locals.$qs.val('ts') }`);

            await setting.remove();
        } catch (e) {
            req.log.error(e.message);
            req.flash('danger', res.__('txt.e500'));
        }
        res.redirect(`/${ res.locals.$module }?ts=${ res.locals.$qs.val('ts') }`);
    }
}

module.exports = Controller;
