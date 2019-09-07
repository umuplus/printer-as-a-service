'use strict';

const { methods, statics } = require('./_');
const { execSync: execute } = require('child_process');
const mongoose = require('mongoose');
const mongooseDelete = require('mongoose-delete');

/**
 * Model class of db.printers
 */
const schema = mongoose.Schema({
    model: { type: 'ObjectId', ref: 'Model', index: true },
    name: { type: String, required: true },
    ip: { type: String, required: true, index: true, unique: true },
    seen: Number,
    options: Object
}, { timestamps: true });

for (let name in methods) schema.methods[name] = methods[name];
schema.methods.isReachable = function () {
    const isWin = /^win/.test(process.platform);
    try {
        return execute(isWin ? `ping -c 1 ${ this.ip }` : `ping -c 1 -W 1 ${ this.ip }`)
            .includes(isWin ? '0% loss' : '0% packet loss');
    } catch (e) {
        return false;
    }
};
for (let name in statics) schema.statics[name] = statics[name]([ 'model' ]);

schema.plugin(mongooseDelete, { deletedAt: true });

module.exports = mongoose.model('Printer', schema);
