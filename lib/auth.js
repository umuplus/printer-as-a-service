'use strict';

const AuthJS = require('node-authjs');
const { join: joinPath } = require('path');

const privateKey = joinPath(__dirname, '../keys/private.key');
const publicKey = `${ privateKey }.pub`;

const auth = new AuthJS({ private: privateKey, public: publicKey });
auth.generate();

module.exports = auth;
