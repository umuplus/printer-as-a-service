'use strict';

const Service = {
    ConvenienceAuthenticationService: {
        ConvenienceAuthenticationPort: {
            InitAuthenticationSession: async function(args, cb, headers, req) {
                try {
                    console.log('SOAP request from ' + req.connection.remoteAddress);
                    return { };
                } catch (e) {
                    return e;
                }
            },
            ValidateAndContinue: async function(args, cb, headers, req) {
                try {
                    console.log('SOAP request from ' + req.connection.remoteAddress);
                    return { };
                } catch (e) {
                    return e;
                }
            },
            ContinueOrCloseSession: function(args, cb, headers, req) {
                try {
                    console.log('SOAP request from ' + req.connection.remoteAddress);
                    return { };
                } catch (e) {
                    return e;
                }
            },
            CloseSession: function(args, cb, headers, req) {
                try {
                    console.log('SOAP request from ' + req.connection.remoteAddress);
                    return { };
                } catch (e) {
                    return e;
                }
            }
        }
    }
};

module.exports = Service;
