'use strict';

const is = require('is_js');
const mongoose = require('../../models');

const PrinterModel = mongoose.model('Model');

class Controller {
    static async list(req, res) {
        try {
            let page = parseInt(res.locals.$qs.val('page'));
            page = is.not.number(page) ? 0 : Math.abs(page);
            const query = {};
            const models = await PrinterModel.paginate(query, page);
            res.render(`${ res.locals.$module }/index`, {
                models: is.array(models) ? models : [],
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
            if (req.method === 'GET') return res.render(`${ res.locals.$module }/form`, { model: null });

            if (is.not.string(req.body.brand) || is.empty(req.body.brand)) throw new Error('invalid brand');
            if (is.not.string(req.body.model) || is.empty(req.body.model)) throw new Error('invalid model');
            if (is.not.string(req.body.code) || is.empty(req.body.code)) throw new Error('invalid code');

            const model = new PrinterModel({ brand: req.body.brand, model: req.body.model });
            model.options = { code: req.body.code };
            await model.save();
            res.redirect(`/${ res.locals.$module }/${ model.id }/edit?ts=${ res.locals.$qs.val('ts') }`);
        } catch (e) {
            req.log.error(e.message);
            req.flash('danger', res.__('txt.e500'));
            res.redirect(`/${ res.locals.$module }/create?ts=${ res.locals.$qs.val('ts') }`);
        }
    }

    static async edit(req, res) {
        try {
            if (!mongoose.Types.ObjectId.isValid(req.params.id))
                return res.redirect(`/${ res.locals.$module }?ts=${ res.locals.$qs.val('ts') }`);

            const model = await PrinterModel.single({ _id: mongoose.Types.ObjectId(req.params.id) });
            if (!model) return res.redirect(`/${ res.locals.$module }?ts=${ res.locals.$qs.val('ts') }`);
            else if (req.method === 'POST') {
                if (is.string(req.body.brand) && is.not.empty(req.body.brand)) model.brand = req.body.brand;
                if (is.string(req.body.model) && is.not.empty(req.body.model)) model.model = req.body.model;
                if (!model.options) model.options = {};
                if (is.string(req.body.code) && is.not.empty(req.body.code)) {
                    model.options.code = req.body.code;
                    model.markModified('options');
                }
                await model.save();
            }
            res.render(`${ res.locals.$module }/form`, { model });
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

            const model = await PrinterModel.single({ _id: mongoose.Types.ObjectId(req.params.id) });
            if (!model) return res.redirect(`/${ res.locals.$module }?ts=${ res.locals.$qs.val('ts') }`);

            await model.remove();
            res.redirect(`/${ res.locals.$module }/${ model.id }/edit?ts=${ res.locals.$qs.val('ts') }`);
        } catch (e) {
            req.log.error(e.message);
            req.flash('danger', res.__('txt.e500'));
            res.redirect(`/${ res.locals.$module }?ts=${ res.locals.$qs.val('ts') }`);
        }
    }
}

module.exports = Controller;
