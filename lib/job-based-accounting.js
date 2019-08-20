'use strict';

const { exec: execute } = require('child_process');
const is = require('is_js');

const ctype = 'application/xrx-acct-data';

class JobBasedAccounting {
    constructor(secure) {
        this._https = !!secure;
    }

    async report(ip) {
        const r = await this._curl(ip, 'get_acct', { 'Content-Type': ctype, 'Request-encoding': 'chunked' });
        return this._parse(r);
    }

    async purge(ip) {
        await this.__get(ip, 'purge', { 'Content-Type': ctype });
    }

    _parse(data) {
        let id = null, jobs = {}, sid = '"job:', sid2 = '"XC-', eq = ' = ';
        for (let line of data.split('\n')) {
            if (line.startsWith(sid)) {
                let jid = line.split(sid);
                if (jid.length === 2) {
                    jid = jid[1].replace('"', '').trim();
                    if (is.string(jid) && is.not.empty(jid)) {
                        id = jid.toString();
                        jobs[id] = { media: [] };
                    }
                }
                continue;
            }
            if (line.startsWith(sid2)) {
                let jid = line.split(':');
                if (jid.length === 2) {
                    jid = jid[1].replace('"', '').trim();
                    if (is.string(jid) && is.not.empty(jid)) {
                        id = jid.toString();
                        jobs[id] = { media: [] };
                    }
                }
                continue;
            }
            if (is.string(id) && is.not.empty(id) && line.includes(eq) && is.existy(jobs[id])) {
                const pair = line.split(eq);
                const key = pair.shift().trim();
                const value = pair.join(eq).replace(/"/g, '').trim();
                if (key.startsWith('jba-media-block')) {
                    const csv = value.split(','), info = { size: 'A4', block: key.split('-').pop() };
                    if (is.string(csv[2]) && is.not.empty(csv[2]) && csv[2].includes('X')) {
                        const size = csv[2].split('X');
                        if (size.length === 2) {
                            const width = parseInt(size[0].trim()), height = parseInt(size[1].trim());
                            if (width && height && (width * height === 420 * 297)) info.size = 'A3';
                        }
                    }
                    info.color = parseInt(csv[5]);
                    info.other = parseInt(csv[6]);
                    jobs[id].media.push(info);
                    continue;
                } else if (key === 'jba-completed-reasons') {
                    if (!value.toLowerCase().includes('completed-normal')) delete jobs[id];
                    continue;
                } else if (key === 'system-job-type') {
                    if (!value.toLowerCase().includes('copy') && !value.toLowerCase().includes('print'))
                        delete jobs[id];
                    else jobs[id]['type'] = value.toLowerCase();
                    continue;
                }
                jobs[id][key] = value.toString();
            }
        }
        return jobs;
    }

    _curl(ip, method, headers) {
        return new Promise((resolve, reject) => {
            let hvalues = [], params = [ '--insecure', '--tlsv1.2', '--connect-timeout', '10 -k -1' ];
            for (let h in headers) hvalues.push(`-H "${ h }: ${ headers[h] }"`);
            hvalues = hvalues.join(' ');
            params = params.join(' ');
            const command = `curl ${ params } ${ hvalues } http${ this._https ? 's' : '' }://${ ip }/acct/${ method }`;
            execute(command, (e, output) => {
                if (e) reject(e);
                else if (is.not.string(output) || is.empty(output) || output.includes('<html') || output.includes('html>'))
                    reject(new Error('invalid response'));
                else resolve(output);
            });
        });
    }
}

module.exports = JobBasedAccounting;
