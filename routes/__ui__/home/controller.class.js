'use strict';

const { accessSync: access, constants, existsSync: exists, unlinkSync: unlink } = require('fs');
const apps = [ 'copy', 'print', 'scan', 'custom' ];
const Configuration = require('../../../lib/config');
const ip = require('ip');
const is = require('is_js');
const mongoose = require('../../../models');

const address = ip.address();
const JobModel = mongoose.model('Job');
const UserModel = mongoose.model('User');

class Controller {
    static async claim(req, res) {
        try {
            if (!res.locals.$printer || !res.locals.$license) throw new Error('invalid request');

            const user = await UserModel.single({ username: req.params.username });
            if (!user || user.deleted) throw new Error('user');

            user.login = Date.now();
            await user.save();
            if (!res.locals.$printer.options) res.locals.$printer.options = {};
            if (res.locals.$printer.seen && Date.now() - res.locals.$printer.seen < 900000)
                if (res.locals.$printer.options.user && res.locals.$printer.options.user !== user.id)
                    throw new Error('already claimed');

            res.locals.$printer.options.user = user.id;
            res.locals.$printer.markModified('options');
            await res.locals.$printer.save();
            res.json({ s: true });
        } catch (e) {
            console.log(e.message);
            res.status(500).json({ e: e.message });
        }
    }

    static async unclaim(req, res) {
        try {
            if (!res.locals.$printer || !res.locals.$license) throw new Error('invalid request');

            const user = await UserModel.single({ username: req.params.username });
            if (!user || user.deleted) throw new Error('user');

            if (!res.locals.$printer.options) res.locals.$printer.options = {};
            if (user.id !== res.locals.$printer.options.user) throw new Error('invalid user');

            res.locals.$printer.options.user = undefined;
            res.locals.$printer.markModified('options');
            await res.locals.$printer.save();
            res.json({ s: true });
        } catch (e) {
            console.log(e.message);
            res.status(500).json({ e: e.message });
        }
    }

    static async index(req, res) {
        let $app = res.locals.$qs.val('app', 'print');
        if (!apps.includes($app)) $app = 'print';
        res.render('__ui__/index', { layout: 'ui', $app });
    }

    static async print(req, res) {
        try {
            const user = await UserModel.single({ username: req.params.username });
            if (!user || user.deleted) throw new Error('user');
            else if (!res.locals.$printer.options || res.locals.$printer.options.user !== user.id) throw new Error('claim');

            const jobs = await JobModel.paginate({ user: user._id }, -1);
            res.render('__ui__/print/index', { layout: 'ui', jobs: is.array(jobs) ? jobs : [], user, $ip: address });
        } catch (e) {
            if (e.message.startsWith('user')) req.flash('danger', res.__('txt.user', req.params.username));
            else if (e.message.startsWith('claim'))
                req.flash('danger', res.__('txt.claim', res.locals.$printer.name, res.locals.$printer.ip, req.params.username));
            else console.log(e.message);
            res.render('__ui__/print/index', { layout: 'ui', jobs: [], user: null, $ip: address });
        }
    }

    static async download(req, res) {
        try {
            if (!res.locals.$printer || !res.locals.$license) throw new Error('invalid request');
            else if (!mongoose.Types.ObjectId.isValid(req.params.job)) new Error('invalid job');

            const job = await JobModel.single({ _id: mongoose.Types.ObjectId(req.params.job) });
            if (!job) throw new Error('job');

            const printer = await Configuration.printer({});
            if (is.not.string(printer.folder) || !exists(printer.folder) || access(printer.folder, constants.W_OK))
                throw new Error('invalid folder');

            if (!printer.folder.endsWith('/')) printer.folder = `${ printer.folder }/`;
            const ps = `${ printer.folder }spool/${ job.id }.ps`;
            res.download(ps);
        } catch (e) {
            console.log(e.message);
            res.status(500).json({});
        }
    }

    static async remove(req, res) {
        try {
            if (!res.locals.$printer || !res.locals.$license) throw new Error('invalid request');
            else if (!mongoose.Types.ObjectId.isValid(req.params.job)) new Error('invalid job');

            const user = await UserModel.single({ username: req.params.username });
            if (!user || user.deleted) throw new Error('user');
            else if (!res.locals.$printer.options || res.locals.$printer.options.user !== user.id) throw new Error('claim');

            user.login = Date.now();
            await user.save();
            const job = await JobModel.single({ _id: mongoose.Types.ObjectId(req.params.job) });
            if (!job) throw new Error('job');

            const printer = await Configuration.printer({});
            if (is.not.string(printer.folder) || !exists(printer.folder) || access(printer.folder, constants.W_OK))
                throw new Error('invalid folder');

            if (!printer.folder.endsWith('/')) printer.folder = `${ printer.folder }/`;
            const ps = `${ printer.folder }spool/${ job.id }.ps`;
            if (exists(ps)) unlink(ps);
            await job.remove();
            res.json({ s: true });
        } catch (e) {
            if (e.message.startsWith('user')) res.json({ e: res.__('txt.user', req.params.username) });
            else if (e.message.startsWith('claim'))
                res.json({ e: res.__('txt.claim', res.locals.$printer.name, res.locals.$printer.ip, req.params.username) });
            else if (e.message.includes('folder')) res.json({ e: res.__('txt.folder') });
            else if (e.message.startsWith('invalid') || e.message.startsWith('job'))
                res.json({ e: res.__('txt.fail') });
            else {
                console.log(e.message);
                res.json({});
            }
        }
    }

    static async pair(req, res) {
        try {
            if (!res.locals.$printer || !res.locals.$license) throw new Error('invalid request');
            else if (!mongoose.Types.ObjectId.isValid(req.params.job)) new Error('invalid job');
            else if (req.params.jid === '-' || !req.body.s) new Error('invalid request');

            const job = await JobModel.single({ _id: mongoose.Types.ObjectId(req.params.job) });
            if (!job) throw new Error('job');

            job.prints.push(req.params.jid);
            await job.save();
            res.json({ s: true });
        } catch (e) {
            console.log(req.url, e.message);
            res.json({});
        }
    }
}

module.exports = Controller;
