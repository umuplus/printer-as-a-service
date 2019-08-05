'use strict';

const is = require('is_js');
const mongoose = require('../../models');

const UserModel = mongoose.model('User');

const privileges = { admin: UserModel._ADMINISTRATOR, master: UserModel._MASTER, user: 0 };

class Controller {
    static async list(req, res) {
        try {
            let page = parseInt(res.locals.$qs.val('page'));
            page = is.not.number(page) ? 0 : Math.abs(page);
            const users = await UserModel.paginate({}, page);
            res.render(`${ res.locals.$module }/index`, {
                users: is.array(users) ? users : [], page, privileges
            });
        } catch (e) {
            req.log.error(e.message);
            req.flash('danger', res.__('txt.e500'));
            res.redirect(`/?ts=${ res.locals.$qs.val('ts') }`);
        }
    }

    static async create(req, res) {
        try {
            if (req.method === 'GET') return res.render(`${ res.locals.$module }/form`, { user: null, privileges });

            if (is.string(req.body.level) && is.not.empty(req.body.level)) req.body.level = parseInt(req.body.level);
            if (is.not.string(req.body.name) || is.empty(req.body.name)) throw new Error('NAME_REQUIRED');
            else if (is.not.string(req.body.username) || is.empty(req.body.username)) throw new Error('USERNAME_REQUIRED');
            else if (is.not.string(req.body.password) || is.empty(req.body.password)) throw new Error('PASSWORD_REQUIRED');
            else if (req.body.password !== req.body.passphrase) throw new Error('PASSWORD_REQUIRED');
            else if (is.number(req.body.level) && req.body.level > req.$user.level) throw new Error('ACCESS_DENIED');

            const user = new UserModel({
                name: req.body.name,
                username: req.body.username,
                password: req.body.password
            });
            user.updatePassword(req.body.password);
            if (req.body.level === privileges.master || req.body.level === privileges.admin || !req.body.level)
                user.level = req.body.level;
            await user.save();
            res.redirect(`/${ res.locals.$module }/${ user.id }/edit?ts=${ res.locals.$qs.val('ts') }`);
        } catch (e) {
            req.log.error(e.message);
            switch (e.message) {
            case 'ACCESS_DENIED':
                req.flash('danger', res.__('txt.e403'));
                break;
            case 'USERNAME_REQUIRED':
                req.flash('danger', res.__('txt.username'));
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
            res.redirect(`/${ res.locals.$module }/create?ts=${ res.locals.$qs.val('ts') }`);
        }
    }

    static async edit(req, res) {
        try {
            if (!mongoose.Types.ObjectId.isValid(req.params.id))
                return res.redirect(`/${ res.locals.$module }?ts=${ res.locals.$qs.val('ts') }`);

            const user = await UserModel.single({ _id: mongoose.Types.ObjectId(req.params.id) });
            if (!user) return res.redirect(`/${ res.locals.$module }?ts=${ res.locals.$qs.val('ts') }`);

            if (req.method === 'POST') {
                if (is.string(req.body.name) && is.not.empty(req.body.name))
                    user.name = req.body.name;
                if (is.string(req.body.username) && is.not.empty(req.body.username)) user.username = req.body.username;
                if (is.string(req.body.password) && is.not.empty(req.body.password)) {
                    if (req.body.password !== req.body.passphrase) throw new Error('PASSWORD_REQUIRED');

                    user.updatePassword(req.body.password);
                }
                if (is.string(req.body.level) && is.not.empty(req.body.level)) req.body.level = parseInt(req.body.level);
                if (is.number(req.body.level) && req.body.level > req.$user.level) throw new Error('ACCESS_DENIED');
                if (req.body.level === privileges.master || req.body.level === privileges.admin || !req.body.level)
                    user.level = req.body.level;
                await user.save();
            }
            res.render(`${ res.locals.$module }/form`, { user, privileges });
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
