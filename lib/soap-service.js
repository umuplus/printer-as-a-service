'use strict';

const mongoose = require('../models');

const PrinterModel = mongoose.model('Printer');

const Service = {
    ConvenienceAuthenticationService: {
        ConvenienceAuthenticationPort: {
            InitAuthenticationSession: async function(args, cb, headers, req) {
                try {
                    console.log('SOAP request from ' + req.connection.remoteAddress, JSON.stringify(args));
                    return { };
                } catch (e) {
                    return e;
                }
            },
            ValidateAndContinue: async function(args, cb, headers, req) {
                try {
                    console.log('SOAP request from ' + req.connection.remoteAddress, JSON.stringify(args));
                    return { };
                } catch (e) {
                    return e;
                }
            },
            ContinueOrCloseSession: async function(args, cb, headers, req) {
                try {
                    console.log('SOAP request from ' + req.connection.remoteAddress, JSON.stringify(args));
                    return { };
                } catch (e) {
                    return e;
                }
            },
            CloseSession: async function(args, cb, headers, req) {
                try {
                    console.log('SOAP request from ' + req.connection.remoteAddress, JSON.stringify(args));
                    const printer = await PrinterModel.single({ ip: req.realIP });
                    if (printer) {
                        printer.seen = Date.now();
                        if (printer.options) {
                            if (printer.options.card) printer.options.card = undefined;
                            if (printer.options.session) printer.options.session = undefined;
                            if (printer.options.user) printer.options.user = undefined;
                            if (printer.options.username) printer.options.username = undefined;
                            printer.markModified('options');
                        }
                        await printer.save();
                    }
                    return { };
                } catch (e) {
                    return e;
                }
            }
        }
    }
};

module.exports = Service;
