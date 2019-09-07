'use strict';

const { auth, methods, statics } = require('./_');
const mongoose = require('mongoose');
const mongooseDelete = require('mongoose-delete');
const shortid = require('shortid');

/**
 * Model class of db.users
 */
const schema = mongoose.Schema({
    name: { type: String, required: true },
    username: { type: String, required: true, index: true, unique: true },
    salt: { type: String, default: shortid.generate },
    password: String,
    level: { type: Number, default: 0 },
    login: Number,
    options: Object
}, {
    timestamps: true,
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
schema.statics._ADMINISTRATOR = 10;
schema.statics._MASTER = 20;

schema.plugin(mongooseDelete, { deletedAt: true });

module.exports = mongoose.model('User', schema);
