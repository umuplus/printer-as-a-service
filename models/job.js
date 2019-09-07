'use strict';

const { methods, statics } = require('./_');
const mongoose = require('mongoose');

/**
 * Model class of db.jobs
 */
const schema = mongoose.Schema({
    user: { type: 'ObjectId', ref: 'User', required: true, index: true },
    name: { type: String, required: true },
    prints: { type: Array, default: [] },
    archived: Boolean,
    options: Object
}, { timestamps: true });

for (let name in methods) schema.methods[name] = methods[name];
for (let name in statics) schema.statics[name] = statics[name]([ 'user' ]);

module.exports = mongoose.model('Job', schema);
