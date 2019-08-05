'use strict';

const { auth, methods, statics } = require('./_');
const mongoose = require('mongoose');
const mongooseDelete = require('mongoose-delete');
const mongooseTimestamps = require('mongoose-timestamp');
const shortid = require('shortid');

/**
 * Model class of db.users
 */
const schema = mongoose.Schema({
    name: { type: String, required: true },
    email: { type: String, required: true, lowercase: true, index: true, unique: true },
    salt: { type: String, default: shortid.generate },
    password: String,
    admin: Boolean,
    login: Number,
    options: Object
}, {
    toObject: {
        transform: (doc, ret) => {
            delete ret.salt;
            delete ret.password;
        }
    },
    toJSON: {
        transform: (doc, ret) => {
            delete ret.salt;
            delete ret.password;
        }
    }
});

for (let name in auth) schema.methods[name] = auth[name];
for (let name in methods) schema.methods[name] = methods[name];
for (let name in statics) schema.statics[name] = statics[name]([]);

schema.plugin(mongooseDelete, { deletedAt: true });
schema.plugin(mongooseTimestamps);

module.exports = mongoose.model('User', schema);
