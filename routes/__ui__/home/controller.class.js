'use strict';

const apps = [ 'copy', 'print', 'scan', 'custom' ];
const is = require('is_js');
const mongoose = require('../../../models');

const JobModel = mongoose.model('Job');
const UserModel = mongoose.model('User');

class Controller {
    static async jobs(req, res) {
        try {
            const user = await UserModel.single({ username: req.body.username });
            if (!user || user.deleted) throw new Error('user');

            const jobs = await JobModel.paginate({ user: user._id }, -1);
            res.json(is.array(jobs) ? jobs : []);
        } catch (e) {
            res.json({ e: e.message });
        }
    }

    static async index(req, res) {
        let $app = res.locals.$qs.val('app', 'print');
        if (!apps.includes($app)) $app = 'print';
        await Controller[$app](req, res);
    }

    static async copy(req, res) {
        res.render('__ui__/copy', { layout: 'ui' });
    }

    static async custom(req, res) {
        res.render('__ui__/custom', { layout: 'ui' });
    }

    static async print(req, res) {
        res.render('__ui__/print/index', { layout: 'ui' });
    }

    static async scan(req, res) {
        res.render('__ui__/scan', { layout: 'ui' });
    }
}

module.exports = Controller;
