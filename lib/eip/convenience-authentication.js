'use strict';

const is = require('is_js');
const WebService = require('../web-service');

class ConvenienceAuthentication extends WebService {
    constructor(ip, https) {
        super('auth/conv_auth_device', `https://${ ip }/webservices/office/smart_auth/1`, https);
    }

    async create(credentials) {
        if (!this._client) this._client = await this._createClient(credentials);
    }

    init(id) {
        return new Promise((resolve, reject) => {
            this._client.InitiateLogin({ SessionID: id }, function (e, r) {
                if (e) reject(e);
                else if (is.object(r)) resolve(r);
                else reject(new Error('invalid response'));
            });
        });
    }

    logout(id, allow) {
        return new Promise((resolve, reject) => {
            this._client.ForceLogout({ SessionID: id, AllowCurrentJobToComplete: allow }, function (e, r) {
                if (e) reject(e);
                else if (is.object(r)) resolve(r);
                else reject(new Error('invalid response'));
            });
        });
    }
}

module.exports = ConvenienceAuthentication;
