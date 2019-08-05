'use strict';

const { auth, methods, statics } = require('./_');
const mongoose = require('mongoose');
const mongooseDelete = require('mongoose-delete');
const mongooseTimestamps = require('mongoose-timestamp');

/**
 * Model class of db.settings
 */
const schema = mongoose.Schema({
    name: { type: String, required: true, index: true, unique: true },
    value: String,
    locked: Boolean
});

for (let name in auth) schema.methods[name] = auth[name];
for (let name in methods) schema.methods[name] = methods[name];
for (let name in statics) schema.statics[name] = statics[name]([]);

schema.plugin(mongooseDelete, { deletedAt: true });
schema.plugin(mongooseTimestamps);

module.exports = mongoose.model('Setting', schema);
