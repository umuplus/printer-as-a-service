'use strict';

const crypto = require('crypto');
const is = require('is_js');

const limit = 20;
function md5(password, salt) {
    return crypto.createHash('md5').update(password + salt).digest('hex').toString();
}

exports.auth = {
    checkPassword: function (password) {
        return this.password === md5(password, this.salt);
    },
    hasPrivileges: function (privileges) {
        if (is.array(privileges))
            for (let privilege of privileges)
                if (is.string(privilege) && this.privileges.includes(privilege)) return true;
        return false;
    },
    updatePassword: function (password) {
        this.password = md5(password, this.salt);
    }
};

exports.md5 = md5;
exports.methods = {
    has: function (field, value) {
        if (is.not.array(this[field])) return false;

        for (let item of this[field]) {
            if (!item && item === value) return true;
            if (item.id && item.id === value) return true;
            if (item === value) return true;
        }
        return false;
    },
    isActive: function () {
        return !this.deleted;
    },
    isInstanceOf: function (className) {
        return this.constructor.modelName === className;
    }
};

exports.queryLimit = limit;

exports.statics = {
    count: function () {
        return function (query) {
            return this.countDocuments(query).exec(); // ? estimatedDocumentCount
        };
    },
    paginate: function (populate) {
        return function (query, page, sort, fields, full) {
            const run = this.find(query).sort(sort || '-_id');
            if (!full) run.lean();
            if (fields instanceof Array && fields.length) run.select(fields.join(' '));
            if (populate instanceof Array && populate.length) run.populate(populate.join(' '));
            if (page >= 0) run.skip(page * limit).limit(limit);
            return run.exec();
        };
    },
    single: function (populate) {
        return function (query, sort, fields) {
            const run = this.findOne(query).sort(sort || '-_id');
            if (fields instanceof Array && fields.length) run.select(fields.join(' '));
            if (populate instanceof Array && populate.length) run.populate(populate.join(' '));
            return run.exec();
        };
    }
};
