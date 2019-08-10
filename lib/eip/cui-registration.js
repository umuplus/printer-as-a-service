'use strict';

const is = require('is_js');
const soapRequest = require('easy-soap-request');
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
            //const options = { IsNative: 'false', IsDisabled: 'false', Provides: [ { Type: 'xeSERVICE', MustProvide: 'true' } ] };
            //for (let key in options) data[key] = options[key];
            this._client.PutRegistration(data, async function (e, r) {
                if (!e) resolve(r);
                else {
                    try {
                        const headers = {
                            'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:65.0) Gecko/20100101 Firefox/65.0',
                            'Content-Type': 'text/xml;charset=UTF-8',
                            'SOAPAction': e.response.request.headers.SOAPAction.replace(/"/g, ''),
                        };
                        let xml = e.response.request.body.replace(/xrx:/g, 'ns:').replace(/xmlns:xrx/g, 'xmlns:ns');
                        if (!xml.includes('<ns:entry>'))
                            xml = xml.replace('<ns:Name>', '<ns:entry><ns:Name>')
                                .replace('</ns:PutRegistrationRequest>', '</ns:entry></ns:PutRegistrationRequest>');
                        //let entry = xml.match(/<ns:PutRegistrationRequest([\s\S]*?)ns:PutRegistrationRequest>/gi);
                        const { response } = await soapRequest(e.response.request.href, headers, xml, 5000);
                        resolve(response.statusCode);
                    } catch (e) {
                        reject(e instanceof Error ? e : 'invalid response');
                    }
                }
            });
        });
    }
}

module.exports = CUIRegistration;
