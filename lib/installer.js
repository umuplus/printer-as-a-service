'use strict';

const { execSync: execute } = require('child_process');
const { existsSync: exists, writeFileSync: writeFile } = require('fs');
const Finder = require('fs-finder');
const is = require('is_js');
const { join: joinPath } = require('path');
const mongoose = require('../models');
const targz = require('targz');

const UserModel = mongoose.model('User');

class Installer {
    static delay(time) {
        return new Promise((resolve) => setTimeout(resolve, is.number(time) ? Math.abs(time) : 1500));
    }

    static justify(text, allocate) {
        if (is.not.string(text)) text = '';
        const spaces = allocate - text.length;
        for (let i = 0 ; i < spaces ; i++) text += ' ';
        return text;
    }

    static async step0() {
        execute('apt-get update', { stdio: 'pipe' });
    }

    static async step1() {
        const cmd = [
            'apt-get install -y software-properties-common python-software-properties poppler-utils',
            'apt-get install -y build-essential htop mc curl libcurl4-openssl-dev'
        ];
        execute(cmd.join(' && '), { stdio: 'pipe' });
    }

    static async step2() {
        execute('apt-get -y install mongodb-server redis-server', { stdio: 'pipe' });
    }

    static async step3() {
        try {
            const version = execute('node -v', { stdio: 'pipe' });
            if (!version.startsWith('v10')) {
                execute('apt remove --purge nodejs npm nodejs-legacy', { stdio: 'pipe' });
                execute('curl -sL https://deb.nodesource.com/setup_10.x | sudo -E bash -', { stdio: 'pipe' });
                execute('apt-get update && apt-get install -y nodejs', { stdio: 'pipe' });
            } else await Installer.delay(1000);
        } catch (e) {
            // * Node.js is not installed
            execute('curl -sL https://deb.nodesource.com/setup_10.x | sudo -E bash -', { stdio: 'pipe' });
            execute('apt-get update && apt-get install -y nodejs', { stdio: 'pipe' });
        }
    }

    static async step4() {
        execute('npm i -g node-pre-gyp node-gyp pm2', { stdio: 'pipe' });
    }

    static async step5() {
        execute('pm2 startup', { stdio: 'pipe' });
    }

    static step6() {
        return new Promise((resolve, reject) => {
            if (!exists('/opt/printer')) {
                let archive, destination = '/opt', path = joinPath(__dirname, 'deploy');
                if (exists(path))
                    for (let file of Finder.in(path).findFiles())
                        if (file && file.endsWith('tar.gz')) archive = file.split('/').pop();
                if (!archive) reject(new Error('application not found'));
                else targz.decompress({
                    src: joinPath(path, archive),
                    dest: destination
                }, (e) => {
                    if (e) reject(e);
                    else resolve();
                });
            } else setTimeout(resolve, 1000);
        });
    }

    static async step7() {
        execute('rm /opt/printer/keys/*', { stdio: 'pipe' });
        execute('cd /opt/printer && npm i', { stdio: 'pipe' });
    }

    static async step8() {
        writeFile('/opt/printer/.env', `APP_PORT=3000
UI_PORT=4000

LOG_LEVEL=error

MONGODB_DEBUG=false
MONGODB_URL=mongodb://127.0.0.1:27017/printer

NODE_ENV=production

REDIS_HOST=127.0.0.1
REDIS_PORT=6379`);
    }

    static async step9() {
        try {
            execute('pm2 stop all && pm2 delete all && pm2 flush', { stdio: 'pipe' });
        } catch (e) {
            // * PM2 doesn't work
        }
        execute('cd /opt/printer && pm2 start pm2.json', { stdio: 'pipe' });
        execute('pm2 save', { stdio: 'pipe' });
    }

    static async step10() {
        let master = new UserModel({ name, username: 'master', password: '-', level: UserModel._MASTER });
        master.updatePassword('master');
        await master.save();

        let admin = new UserModel({ name, username: 'admin', password: '-', level: UserModel._ADMINISTRATOR });
        admin.updatePassword('admin');
        await admin.save();
    }
}

module.exports = Installer;
