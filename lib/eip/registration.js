'use strict';

const $defaults = require('../../etc/defaults');
const $error = require('../../common/dvs/xerox/common/index').errors;
const $toolset = require('../../common/dvs/xerox/common/index').toolset.$instance;

const ApiResponse = require('../../common/dvs/xerox/common/index').response;
const CUIRegistrationHelper = require('../lib/presentation').CUIRegistration;
const format = require('util').format;

function listRegistrations(req, callback) {
    $toolset.log('eip.reg.list.req', JSON.stringify(req));
    const $api = new ApiResponse();
    if (!$toolset.isString(req.ip, true))
        return callback($api.setError($error.MISSING_PARAMETER).setKey('param', 'ip').getObject());

    const $register = new CUIRegistrationHelper({
        ip: req.ip,
        password: req.password,
        username: req.username,
        https: !!req.https
    });
    $register.create(function (error) {
        if (error) {
            $toolset.log('reg.create', error.message);
            return callback($api.setError(format($error.SOAP.FAILED, $register.getKey('service')))
                .setKey('message', error.message).getObject());
        }

        $register.ListRegistrations(function (error, apps) {
            if (error) {
                $toolset.log('reg.list', error.message);
                return callback($api
                    .setError(format($error.SOAP.METHOD_FAILED, 'list', $register.getKey('service')))
                    .setKey('xml', $register.$client.lastRequest)
                    .setKey('message', error.message).getObject());
            }

            callback($api.setData(apps).getObject());
        });
    });
}

exports.listRegistrations = listRegistrations;

function getRegistration(req, callback) {
    $toolset.log('eip.reg.get.req', JSON.stringify(req));
    const $api = new ApiResponse();
    if (!$toolset.isString(req.ip, true))
        return callback($api.setError($error.MISSING_PARAMETER).setKey('param', 'ip').getObject());

    const $register = new CUIRegistrationHelper({
        ip: req.ip,
        password: req.password,
        username: req.username,
        https: !!req.https
    });
    $register.create(function (error) {
        if (error) {
            $toolset.log('reg.create', error.message);
            return callback($api.setError(format($error.SOAP.FAILED, $register.getKey('service')))
                .setKey('message', error.message).getObject());
        }

        $register.GetRegistration({'ns:name': req.name}, function (error, app) {
            if (error) {
                $toolset.log('reg.get', error.message);
                return callback($api
                    .setError(format($error.SOAP.METHOD_FAILED, 'get', $register.getKey('service')))
                    .setKey('xml', $register.$client.lastRequest)
                    .setKey('message', error.message).getObject());
            }

            callback($api.setData(app).getObject());
        });
    });
}

exports.getRegistration = getRegistration;

function deleteRegistration(req, callback) {
    $toolset.log('eip.reg.del.req', JSON.stringify(req));
    const $api = new ApiResponse();
    if (!$toolset.isString(req.ip, true))
        return callback($api.setError($error.MISSING_PARAMETER).setKey('param', 'ip').getObject());

    const $register = new CUIRegistrationHelper({
        ip: req.ip,
        password: req.password,
        username: req.username,
        https: !!req.https
    });
    $register.create(function (error) {
        if (error) {
            $toolset.log('reg.create', error.message);
            return callback($api.setError(format($error.SOAP.FAILED, $register.getKey('service')))
                .setKey('message', error.message).getObject());
        }

        $register.DeleteRegistration({
            'ns:name': req.name,
            'ns:checksum': req.checksum
        }, function (error, app) {
            if (error) {
                $toolset.log('reg.del', error.message);
                return callback($api
                    .setError(format($error.SOAP.METHOD_FAILED, 'delete', $register.getKey('service')))
                    .setKey('xml', $register.$client.lastRequest)
                    .setKey('message', error.message).getObject());
            }

            callback($api.setData(app).getObject());
        });
    });
}

exports.deleteRegistration = deleteRegistration;

function putRegistration(req, callback) {
    $toolset.log('eip.reg.put.req', JSON.stringify(req));
    const $api = new ApiResponse();
    if (!$toolset.isString(req.ip, true))
        return callback($api.setError($error.MISSING_PARAMETER).setKey('param', 'ip').getObject());

    const $register = new CUIRegistrationHelper({
        ip: req.ip,
        password: req.password,
        username: req.username,
        https: !!req.https
    });
    $register.create(function (error) {
        if (error) {
            $toolset.log('reg.create', error.message);
            return callback($api.setError(format($error.SOAP.FAILED, $register.getKey('service')))
                .setKey('message', error.message).getObject());
        }

        $register.PutRegistration({
            _xml: $toolset.toSoapBody({
                Name: req.name,
                Description: '',
                VendorName: req.vendor,
                IsNative: 'false',
                SmallIconUrl: req.smallIconUrl,
                LargeIconUrl: req.largeIconUrl,
                ToolsIconUrl: req.toolsIconUrl,
                Url: req.url,
                DescriptionUrl: req.descriptionUrl,
                IsDisabled: 'false',
                Provides: {
                    Type: 'xeSERVICE',
                    MustProvide: 'true'
                },
            }, 'PutRegistrationRequest', 'ns')
        }, function (error, app) {
            if (error) {
                $toolset.log('reg.put', error.message);
                return callback($api
                    .setError(format($error.SOAP.METHOD_FAILED, 'get', $register.getKey('service')))
                    .setKey('xml', $register.$client.lastRequest)
                    .setKey('message', error.message).getObject());
            }

            callback($api.setData(app).getObject());
        });
    });
}

exports.putRegistration = putRegistration;

function replaceRegistration(req, callback) {
    $toolset.log('eip.reg.replace.req', JSON.stringify(req));
    const $api = new ApiResponse();
    if (!$toolset.isString(req.ip, true))
        return callback($api.setError($error.MISSING_PARAMETER).setKey('param', 'ip').getObject());

    $defaults.dataService.send({type: 'config.get', key: 'printer'},
        function (response) {
            const $config = $api.check(response);
            if (!$toolset.isObject($config, true))
                return callback($api.setError($error.VIRTUAL_PRINTER.CONFIG_NOT_FOUND)
                    .setKey('message', response.d ? response.d.message : null)
                    .getObject());

            if (!req.name) req.name = $config.app;
            req.vendor = $config.vendor;
            listRegistrations({
                ip: req.ip,
                https: !!req.https
            }, function (response) {
                let checksum = null;
                const $app = $api.check(response, $api.TYPES.ARRAY);
                if ($toolset.isArray($app, true))
                    $app.forEach(function (app) {
                        if (app.name === req.name) checksum = app.checksum;
                    });

                $toolset.log('reg checksum', format('%s - %s', req.name, checksum));
                if (!$toolset.isString(checksum, true)) return putRegistration(req, callback);

                deleteRegistration({
                    checksum: checksum,
                    ip: req.ip,
                    name: req.name,
                    password: req.password,
                    username: req.username,
                    https: !!req.https
                }, function ($del) {
                    if (!$toolset.isObject($del, true) || !$del.s)
                        return callback($api.setError($error.APPLICATION.FAILED)
                            .setKey('message', $del.d ? $del.d.message : null)
                            .setKey('xml', $del.d ? $del.d.xml : null)
                            .getObject());

                    putRegistration(req, callback);
                });
            });
        });
}

exports.replaceRegistration = replaceRegistration;
