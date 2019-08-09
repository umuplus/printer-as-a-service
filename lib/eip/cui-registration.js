'use strict';

const is = require('is_js');
const WebService = require('../web-service');

class CUIRegistration extends WebService {
    constructor(ip, https) {
        super('registration/CUIRegistration', `http://${ ip }/webservices/office/cuiregistration/1`, https);
    }

    async create(credentials) {
        if (!this._client) this._client = await this._createClient(credentials);
    }

    list() {
        return new Promise((resolve, reject) => {
            this._client.ListRegistrations(function (e, r) {
                if (e) reject(e);
                else if (is.object(r) && is.array(r.element)) resolve(r.element);
                else reject(new Error('invalid response'));
            });
        });
    }

    remove(name, checksum) {
        return new Promise((resolve, reject) => {
            this._client.DeleteRegistration({ 'ns:name': name, 'ns:checksum': checksum }, function (e, r) {
                if (e) reject(e);
                else resolve(r);
            });
        });
    }

    put(data) {
        return new Promise((resolve, reject) => {
            const options = { IsNative: 'false', IsDisabled: 'false', Provides: { Type: 'xeSERVICE', MustProvide: 'true' } };
            for (let key in options) data[key] = options[key];
            //console.log(this._body(data, 'PutRegistrationRequest', 'ns'));
            this._client.DeleteRegistration(data, function (e, r) {
                if (e) reject(e);
                else resolve(r);
            });
        });
    }
}

module.exports = CUIRegistration;
