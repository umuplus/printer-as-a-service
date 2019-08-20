'use strict';

const auth = require('../lib/auth');
const is = require('is_js');
const mongoose = require('../models');

const SettingModel = mongoose.model('Setting');

class Configuration {
    static async fetch(name, _default) {
        if (is.not.string(name)) throw new Error('invalid name');

        const setting = await SettingModel.single({ name });
        if (!setting) throw new Error('invalid settings');
        const value = auth.verify(setting.value);
        return value || _default;
    }

    static async prices(value) {
        return Configuration.fetch('prices', value);
    }

    static async printer(value) {
        return Configuration.fetch('printer', value);
    }

    static async system(value) {
        return Configuration.fetch('system', value);
    }
}

module.exports = Configuration;
