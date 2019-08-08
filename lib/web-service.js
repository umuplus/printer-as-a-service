'use strict';

const { accessSync: access, constants, existsSync: exists } = require('fs');
const is = require('is_js');
const joinPath = require('path').join;
const soap = require('soap');

class WebService {
    constructor(service, endpoint, https) {
        const options = { endpoint };
        if (https) options.endpoint = options.endpoint.replace('http:', 'https:');
        this._options = options;
        this._wsdl = `${ joinPath(__dirname, '../data/wsdl/', service) }.wsdl`;
        if (is.not.string(this._wsdl) || !exists(this._wsdl) || access(this._wsdl, constants.W_OK))
            throw new Error('invalid wsdl');
    }

    _createClient(credentials) {
        return new Promise((resolve, reject) => {
            soap.createClient(this._wsdl, this._options, function (e, c) {
                if (e) reject(e);

                if (credentials && credentials.username && credentials.password)
                    c.setSecurity(new soap.WSSecurity(credentials.username, credentials.password, { nonceEncoding: false,
                        hasNonce: true, hasTimeStamp: false, hasTokenCreated: true, mustUnderstand: true,
                        passwordType: 'PasswordDigest' }));
                resolve(c);
            });
        });
    }
}

module.exports = WebService;
