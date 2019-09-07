'use strict';

const { methods, statics } = require('./_');
const mongoose = require('mongoose');

/**
 * Model class of db.models
 */
const schema = mongoose.Schema({
    brand: { type: String, required: true },
    model: { type: String, required: true },
    options: Object
}, { timestamps: true });

for (let name in methods) schema.methods[name] = methods[name];
for (let name in statics) schema.statics[name] = statics[name]([]);

module.exports = mongoose.model('Model', schema);
