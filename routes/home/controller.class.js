'use strict';

const auth = require('../../lib/auth');
const is = require('is_js');
const mongoose = require('../../models');

const UserModel = mongoose.model('User');

class Controller {
    static async index(req, res) {
        if (is.empty(res.locals.$user)) return res.redirect(`/sign-in?ts=${ res.locals.$qs.val('ts') }`);

        const usersActive = await UserModel.count({ deleted: false });
        const usersPassive = await UserModel.count({ deleted: true });

        res.render('index', { usersActive, usersPassive });
    }

    static async login(req, res) {
        if (req.method === 'GET') return res.render('login', { layout: false });

        try {
            if (is.not.string(req.body.username) || is.not.string(req.body.password))
                throw new Error('INVALID_CREDENTIALS');

            const user = await UserModel.single({ username: req.body.username });
            if (!user || user.deleted || !user.checkPassword(req.body.password)) throw new Error('NOT_FOUND');
            if (user.level < res.locals.$privileges.admin) throw new Error('ACCESS_DENIED');

            user.login = Date.now();
            await user.save();
            req.session.token = auth.sign({ username: user.username, t: new Date() });
            await req.session.save();
            res.redirect(`/?ts=${ res.locals.$qs.val('ts') }`);
        } catch (e) {
            req.log.error(e.message);
            req.flash('danger', res.__('txt.login'));
            res.redirect(`/sign-in?ts=${ res.locals.$qs.val('ts') }`);
        }
    }

    static logout(req, res) {
        req.session.token = undefined;
        req.session.save(() => res.redirect(`/?ts=${ res.locals.$qs.val('ts') }`));
    }

    static language(req, res) {
        req.session.lang = req.params.lang;
        req.session.save(() => res.redirect(`/?ts=${ res.locals.$qs.val('ts') }`));
    }
}

module.exports = Controller;
