'use strict';

const { methods, statics } = require('./_');
const mongoose = require('mongoose');
const mongooseDelete = require('mongoose-delete');
const mongooseTimestamps = require('mongoose-timestamp');

/**
 * Model class of db.printers
 */
const schema = mongoose.Schema({
    model: { type: 'ObjectId', ref: 'Model', index: true },
    name: { type: String, required: true },
    ip: { type: String, required: true, index: true, unique: true },
    seen: Number,
    options: Object
});

for (let name in methods) schema.methods[name] = methods[name];
for (let name in statics) schema.statics[name] = statics[name]([ 'model' ]);

schema.plugin(mongooseDelete, { deletedAt: true });
schema.plugin(mongooseTimestamps);

module.exports = mongoose.model('Printer', schema);
