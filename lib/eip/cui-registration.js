'use strict';

const is = require('is_js');
const WebServiceHelper = require('../web-service');

class CUIRegistration extends WebServiceHelper {
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
}

module.exports = CUIRegistration;
