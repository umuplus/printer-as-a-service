'use strict';

const Configuration = require('../lib/config');
const is = require('is_js');
const mongoose = require('../models');

const PrinterModel = mongoose.model('Printer');
const ReportModel = mongoose.model('Report');
const UserModel = mongoose.model('User');

class Service {
    static _name() {
        return 'stats';
    }

    static async upsert(payload) {
        try {
            if (is.not.object(payload.data)) throw new Error('invalid data');
            else if (!mongoose.Types.ObjectId.isValid(payload.data.p)) throw new Error('invalid printer');
            else if (!mongoose.Types.ObjectId.isValid(payload.data.u)) throw new Error('invalid user');
            else if (is.not.number(payload.data.t)) throw new Error('invalid time');
            else if (is.not.array(payload.data.d)) throw new Error('invalid data');

            const prices = await Configuration.prices({}); // TODO: apply custom prices to user groups
            const printer = await PrinterModel.single({ _id: mongoose.Types.ObjectId(payload.data.p) });
            if (!printer || printer.deleted) throw new Error('unknown printer');

            const user = await UserModel.single({ _id: mongoose.Types.ObjectId(payload.data.u) });
            if (!user || user.deleted) throw new Error('unknown user');

            const query = { printer: printer._id, user: user._id, when: payload.data.t };
            const increase = { jobs: 1, pages: 0, coloredPages: 0, cost: 0 };
            for (let media of payload.data.d) {
                if (media.color) {
                    increase.coloredPages += media.color;
                    const key = `${ media.size ? media.size.toUpperCase() : '?' }_c`;
                    if (is.number(prices[key])) increase.cost += prices[key] * media.color;
                }
                if (media.other) {
                    increase.pages += media.other;
                    const key = media.size ? media.size.toUpperCase() : '?';
                    if (is.number(prices[key])) increase.cost += prices[key] * media.color;
                }
            }
            await ReportModel.update(query, { $inc: increase }, { upsert: true, atomic: true });
        } catch (e) {
            console.log(e.message);
            payload.retry();
        }
    }
}

module.exports = Service;
