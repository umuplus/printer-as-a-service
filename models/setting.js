'use strict';

const { methods, statics } = require('./_');
const mongoose = require('mongoose');

/**
 * Model class of db.settings
 */
const schema = mongoose.Schema({
    name: { type: String, required: true, index: true, unique: true },
    value: { type: String, required: true },
    keep: Boolean
}, { timestamps: true });

for (let name in methods) schema.methods[name] = methods[name];
for (let name in statics) schema.statics[name] = statics[name]([]);

module.exports = mongoose.model('Setting', schema);
