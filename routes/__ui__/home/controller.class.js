'use strict';

const { accessSync: access, constants, existsSync: exists, readFileSync: readFile, unlinkSync: unlink } = require('fs');
const apps = [ 'copy', 'print', 'scan', 'custom' ];
const Configuration = require('../../../lib/config');
const ip = require('ip');
const is = require('is_js');
const joinPath = require('path').join;
const mongoose = require('../../../models');
const ScanTemplate = require('../../../lib/eip/scan-template');

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

    static async copy(req, res) {
        try {
            const user = await UserModel.single({ username: req.params.username });
            if (!user || user.deleted) throw new Error('user');
            else if (!res.locals.$printer.options || res.locals.$printer.options.user !== user.id) throw new Error('claim');

            res.render('__ui__/copy/index', { layout: 'ui', user, $ip: address });
        } catch (e) {
            if (e.message.startsWith('user')) req.flash('danger', res.__('txt.user', req.params.username));
            else if (e.message.startsWith('claim'))
                req.flash('danger', res.__('txt.claim', res.locals.$printer.name, res.locals.$printer.ip, req.params.username));
            else req.flash('danger', res.__('txt.fail'));
            res.render('__ui__/copy/index', { layout: 'ui', user: null, $ip: address });
        }
    }

    static async custom(req, res) {
        try {
            const user = await UserModel.single({ username: req.params.username });
            if (!user || user.deleted) throw new Error('user');
            else if (!res.locals.$printer.options || res.locals.$printer.options.user !== user.id) throw new Error('claim');

            res.render('__ui__/custom/index', { layout: 'ui', user, $ip: address });
        } catch (e) {
            if (e.message.startsWith('user')) req.flash('danger', res.__('txt.user', req.params.username));
            else if (e.message.startsWith('claim'))
                req.flash('danger', res.__('txt.claim', res.locals.$printer.name, res.locals.$printer.ip, req.params.username));
            else req.flash('danger', res.__('txt.fail'));
            res.render('__ui__/custom/index', { layout: 'ui', user: null, $ip: address });
        }
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
            else req.flash('danger', res.__('txt.fail'));
            res.render('__ui__/print/index', { layout: 'ui', jobs: [], user: null, $ip: address });
        }
    }

    static async scan(req, res) {
        let samba;
        try {
            samba = await Configuration.samba({});
            const user = await UserModel.single({ username: req.params.username });
            if (!user || user.deleted) throw new Error('user');
            else if (!res.locals.$printer.options || res.locals.$printer.options.user !== user.id) throw new Error('claim');

            res.render('__ui__/scan/index', { layout: 'ui', user, $ip: address, samba });
        } catch (e) {
            if (e.message.startsWith('user')) req.flash('danger', res.__('txt.user', req.params.username));
            else if (e.message.startsWith('claim'))
                req.flash('danger', res.__('txt.claim', res.locals.$printer.name, res.locals.$printer.ip, req.params.username));
            else req.flash('danger', res.__('txt.fail'));
            res.render('__ui__/scan/index', { layout: 'ui', user: null, $ip: address, samba });
        }
    }

    static async template(req, res) {
        try {
            const printer = res.locals.$printer;
            const model = printer.model;
            if (!model) throw new Error('invalid device');
            else if (!mongoose.Types.ObjectId.isValid(printer.options.user)) throw new Error('invalid user');

            if (req.body.color === 'FULL_COLOR') req.body.bits_per_pixel = 24;
            else if (req.body.color === 'GRAYSCALE') req.body.bits_per_pixel = 8;
            else req.body.bits_per_pixel = 1;

            const samba = await Configuration.samba({});
            const user = await UserModel.single({ _id: mongoose.Types.ObjectId(printer.options.user) });
            if (!user || user.deleted) throw new Error('user');

            const name = `${ samba.name || 'SCANTOHOMESAMBA' }.xst`;
            if (samba.username) req.body.username = samba.username;
            if (samba.password) req.body.password = samba.password;
            const template = await Controller._buildTemplate(req.body, model, samba, name);

            const auth = await Controller._auth(req.body, printer, samba);
            if (!auth) throw new Error('access denied');

            const manager = new ScanTemplate(printer.ip, printer.options ? printer.options.https : false);
            await manager.create();
            const templates = await manager.list();
            let checksum = -1;
            if (is.array(templates))
                for (let tmp of templates)
                    if (tmp.name === name) checksum = tmp.checksum;
            if (checksum !== -1) await manager.remove(name, checksum);
            await manager.put(name, template);
            res.json({ t: name });
        } catch (e) {
            console.log(e.message);
            res.json({ e: e.message });
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
            console.log(e);
            res.status(500).json({ e: e.message });
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

    static async _buildTemplate(data, model, samba, name) {
        const system = await Configuration.system({});
        let template = readFile(joinPath(__dirname, '../../../data/', `${ model.options.code }.xst`)).toString();
        let destination = readFile(joinPath(__dirname, '../../../data/',
            `${ model.options.code.split('/').shift() }/samba.xst`)).toString();

        template = template.toString();
        template = template.replace('$name', name);
        template = template.replace('$document_format', 'PDF');
        template = template.replace('$input_size', 'auto');
        template = template.replace('$quality', '128');
        template = template.replace('$auto_exposure', 'OFF');
        template = template.replace('$auto_contrast', 'FALSE');
        template = template.replace('$images_per_document', '0');
        template = template.replace('$optimized_for_fast_web_view', 'NONE');
        template = template.replace('$confirmation_method', 'NONE');
        template = template.replace('$input_size_manual', '');
        template = template.replace('$input_media_size', 'MIXED');
        template = template.replace('$resolution_str', 'RES_300X300');
        template = template.replace('$full_name', name);
        template = template.replace('$searchable_text', system.ocr || '0');
        template = template.replace('$sides_to_scan', data.side);
        template = template.replace('$color_mode', data.color);
        template = template.replace('$bits_per_pixel', data.bits_per_pixel);

        destination = destination.toString();
        destination = destination.replace('$filing_policy', 'NEW_AUTO_GENERATE');
        destination = destination.replace('$filing_protocol', 'SMB');
        destination = destination.replace('$path', samba.path.replace('{username}', data.folder || data.username));
        destination = destination.replace('$host', samba.host);
        destination = destination.replace('$port', samba.port);
        destination = destination.replace('$shareName', samba.shareName);
        destination = destination.replace('$login', samba.domain ? samba.domain + '\\\\' + data.username : data.username);
        destination = destination.replace(new RegExp('\\$user', 'g'), data.username || '');
        destination = destination.replace('$pass', data.password || '');
        destination = destination.replace('$xsm', '');
        return template.replace('$destination', destination);
    }

    static async _auth(data, printer, samba) {
        try {
            if (!samba.method) return true;
        } catch (e) {
            console.log(e);
            return false;
        }
    }
}

module.exports = Controller;
