'use strict';

const is = require('is_js');
const WebService = require('../web-service');

class TemplateManager extends WebService {
    constructor(ip, https) {
        super('scan/TemplateManagement', `http://${ ip }/webservices/office/template_management/1`, https);
    }

    async create(credentials) {
        if (!this._client) this._client = await this._createClient(credentials);
    }

    list() {
        return new Promise((resolve, reject) => {
            this._client.ListTemplates(function (e, r) {
                if (e) reject(e);
                else if (is.object(r) && is.array(r.TemplateEntry)) {
                    const templates = [];
                    for (let tmp of r.TemplateEntry) {
                        const data = {};
                        if (is.object(tmp.TemplateName) && is.string(tmp.TemplateName.$value))
                            data.name = tmp.TemplateName.$value;
                        else if (is.string(tmp.TemplateName)) data.name = tmp.TemplateName;
                        if (is.object(tmp.TemplateChecksum) && is.string(tmp.TemplateChecksum.$value))
                            data.checksum = tmp.TemplateChecksum.$value;
                        else if (is.string(tmp.TemplateChecksum) || is.sumber(tmp.TemplateChecksum))
                            data.checksum = tmp.TemplateChecksum;
                        if (Object.keys(data).length === 2) templates.push(data);
                    }
                    resolve(templates);
                } else reject(new Error('invalid response'));
            });
        });
    }

    remove(name, checksum) {
        return new Promise((resolve, reject) => {
            this._client.DeleteTemplate({ 'ns:templateName': name, 'ns:priorChecksum': checksum }, function (e, r) {
                if (e) reject(e);
                else resolve(r);
            });
        });
    }

    put(name, content) {
        return new Promise((resolve, reject) => {
            this._client.PutTemplate({ 'ns:templateName': name, 'ns:templateContent': content }, async function (e) {
                if (!e) resolve(true);
                else reject(e);
            });
        });
    }
}

module.exports = TemplateManager;
