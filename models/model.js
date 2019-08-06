'use strict';

const { methods, statics } = require('./_');
const mongoose = require('mongoose');
const mongooseTimestamps = require('mongoose-timestamp');

/**
 * Model class of db.models
 */
const schema = mongoose.Schema({
    brand: { type: String, required: true },
    model: { type: String, required: true },
    options: Object
});

for (let name in methods) schema.methods[name] = methods[name];
for (let name in statics) schema.statics[name] = statics[name]([]);

schema.plugin(mongooseTimestamps);

module.exports = mongoose.model('Model', schema);
