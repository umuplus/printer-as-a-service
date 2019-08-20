'use strict';

const { methods, statics } = require('./_');
const mongoose = require('mongoose');
const mongooseTimestamps = require('mongoose-timestamp');

/**
 * Model class of db.reports
 */
const schema = mongoose.Schema({
    printer: { type: 'ObjectId', ref: 'Printer', required: true, index: true },
    user: { type: 'ObjectId', ref: 'User', required: true, index: true },
    when: { type: Number, required: true, index: true },
    jobs: { type: Number, default: 0 },
    pages: { type: Number, default: 0 },
    coloredPages: { type: Number, default: 0 },
    cost: { type: Number, default: 0 }
});

for (let name in methods) schema.methods[name] = methods[name];
for (let name in statics) schema.statics[name] = statics[name]([ 'user' ]);

schema.plugin(mongooseTimestamps);

module.exports = mongoose.model('Report', schema);
