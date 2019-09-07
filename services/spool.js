'use strict';

const { accessSync: access, constants, existsSync: exists, unlinkSync: unlink } = require('fs');
const Configuration = require('../lib/config');
const { execSync: execute } = require('child_process');
const formatDate = require('date-fns/format');
const is = require('is_js');
const mkdirp = require('mkdirp');
const mongoose = require('../models');

const JobModel = mongoose.model('Job');

class Service {
    static _name() {
        return 'spool';
    }

    static _mkdirp(path) {
        return new Promise((resolve, reject) => {
            mkdirp(path, function (e) {
                if (e) reject(e);
                else resolve();
            });
        });
    }

    static async expire(payload) {
        try {
            if (is.not.object(payload.data)) throw new Error('invalid data');

            if (!mongoose.Types.ObjectId.isValid(payload.data.id)) throw new Error('invalid job id');

            const job = await JobModel.single({ _id: mongoose.Types.ObjectId(payload.data.id) });
            if (!job) throw new Error('job not found');

            // TODO what to do if document has not been archived yet and already printed?
            if (!payload.data.printed || job.prints.length) {
                const printer = await Configuration.printer({});
                if (is.not.string(printer.folder) || !exists(printer.folder) || access(printer.folder, constants.W_OK))
                    throw new Error('invalid folder');

                if (!printer.folder.endsWith('/')) printer.folder = `${ printer.folder }/`;
                const ps = `${ printer.folder }spool/${ job.id }.ps`;
                if (exists(ps)) unlink(ps);
                await job.remove();
            }
        } catch (e) {
            console.log(e.message);
        }
    }

    static async archive(payload) {
        try {
            if (is.not.object(payload.data)) throw new Error('invalid data');

            if (!mongoose.Types.ObjectId.isValid(payload.data.id)) throw new Error('invalid job id');

            const job = await JobModel.single({ _id: mongoose.Types.ObjectId(payload.data.id) });
            if (!job) throw new Error('job not found');

            const printer = await Configuration.printer({});
            if (is.not.string(printer.folder) || !exists(printer.folder) || access(printer.folder, constants.W_OK))
                throw new Error('invalid folder');

            if (!printer.folder.endsWith('/')) printer.folder = `${ printer.folder }/`;
            const ps = `${ printer.folder }spool/${ job.id }.ps`;
            if (!exists(ps) || access(printer.folder, constants.R_OK)) throw new Error('file not found in spool');

            const when = formatDate(job.createdAt, 'yyyy-MM-dd');
            if (is.not.string(printer.archive)) throw new Error('invalid archive');
            printer.archive = printer.archive.replace('{date}', when).replace('{user}', job.user.username);
            if (!printer.archive.endsWith('/')) printer.archive = `${ printer.archive }/`;
            await Service._mkdirp(printer.archive);
            if (!exists(printer.archive) || access(printer.archive, constants.W_OK)) throw new Error('archive not found');

            const pdf = `${ printer.archive }${ job.id }.pdf`;
            if (!exists(pdf)) execute(`ps2pdf ${ ps } ${ pdf }`);
            if (!exists(pdf)) throw new Error(`archive(${ pdf }) failed`);
            job.archived = true;
            job.increment();
            await job.save();
        } catch (e) {
            console.log(e.message);
            payload.retry();
        }
    }
}

module.exports = Service;
