'use strict';

const is = require('is_js');
const mongoose = require('../../models');

const UserModel = mongoose.model('User');

class Controller {
    static async list(req, res) {
        try {
            let page = parseInt(res.locals.$qs.val('page'));
            page = is.not.number(page) ? 0 : Math.abs(page);
            const users = await UserModel.paginate({}, page);
            res.render(`${ res.locals.$module }/index`, {
                users: is.array(users) ? users : [],
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
            if (req.method === 'GET') return res.render(`${ res.locals.$module }/form`, { user: null });

            if (is.not.string(req.body.name) || is.empty(req.body.name)) throw new Error('NAME_REQUIRED');
            else if (is.not.email(req.body.email)) throw new Error('EMAIL_REQUIRED');
            else if (is.not.string(req.body.password) || is.empty(req.body.password)) throw new Error('PASSWORD_REQUIRED');
            else if (req.body.password !== req.body.passphrase) throw new Error('PASSWORD_REQUIRED');

            const user = new UserModel({
                name: req.body.name,
                email: req.body.email,
                password: req.body.password,
                admin: req.$user.admin && req.body.admin === 'true'
            });
            user.updatePassword(req.body.password);
            await user.save();
            res.redirect(`/${ res.locals.$module }/${ user.id }/edit?ts=${ res.locals.$qs.val('ts') }`);
        } catch (e) {
            req.log.error(e.message);
            switch (e.message) {
            case 'EMAIL_REQUIRED':
                req.flash('danger', res.__('txt.email'));
                break;
            case 'PASSWORD_REQUIRED':
                req.flash('danger', res.__('txt.password'));
                break;
            case 'NAME_REQUIRED':
                req.flash('danger', res.__('txt.name'));
                break;
            default:
                req.flash('danger', res.__('txt.e500'));
            }
            res.render(`${ res.locals.$module }/form`, { user: null });
        }
    }

    static async edit(req, res) {
        try {
            if (!mongoose.Types.ObjectId.isValid(req.params.id))
                return res.redirect(`/${ res.locals.$module }?ts=${ res.locals.$qs.val('ts') }`);

            const user = await UserModel.single({ _id: mongoose.Types.ObjectId(req.params.id) });
            if (!user) return res.redirect(`/${ res.locals.$module }?ts=${ res.locals.$qs.val('ts') }`);
            if (user.admin && !req.$user.admin) throw new Error('ACCESS_DENIED');

            if (req.method === 'POST') {
                user.admin = req.$user.admin && req.body.admin === 'true';
                if (is.string(req.body.name) && is.not.empty(req.body.name))
                    user.name = req.body.name;
                if (is.email(req.body.email)) user.email = req.body.email;
                if (is.string(req.body.password) && is.not.empty(req.body.password)) {
                    if (req.body.password !== req.body.passphrase) throw new Error('PASSWORD_REQUIRED');

                    user.updatePassword(req.body.password);
                }
                await user.save();
            }
            res.render(`${ res.locals.$module }/form`, { user });
        } catch (e) {
            req.log.error(e.message);
            switch (e.message) {
            case 'ACCESS_DENIED':
                req.flash('danger', res.__('txt.e403'));
                break;
            case 'PASSWORD_REQUIRED':
                req.flash('danger', res.__('txt.password'));
                break;
            default:
                req.flash('danger', res.__('txt.e500'));
            }
            res.redirect(`/${ res.locals.$module }/${ req.params.id }/edit?ts=${ res.locals.$qs.val('ts') }`);
        }
    }

    static async status(req, res, status) {
        try {
            if (!mongoose.Types.ObjectId.isValid(req.params.id))
                res.redirect(`/${ res.locals.$module }?ts=${ res.locals.$qs.val('ts') }`);

            const user = await UserModel.single({ _id: mongoose.Types.ObjectId(req.params.id) });
            if (!user) return res.redirect(`/${ res.locals.$module }?ts=${ res.locals.$qs.val('ts') }`);

            if (status) await user.restore();
            else await user.delete();
            res.redirect(`/${ res.locals.$module }/${ user.id }/edit?ts=${ res.locals.$qs.val('ts') }`);
        } catch (e) {
            req.log.error(e.message);
            req.flash('danger', res.__('txt.e500'));
            res.redirect(`/${ res.locals.$module }?ts=${ res.locals.$qs.val('ts') }`);
        }
    }
}

module.exports = Controller;
