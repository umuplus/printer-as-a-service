'use strict';

const auth = require('../../lib/auth');
const Configuration = require('../../lib/config');
const cookieParser = require('cookie-parser');
const express = require('express');
const formatDate = require('date-fns/format');
const helmet = require('helmet');
const i18n = require('i18n');
const is = require('is_js');
const layout = require('express-ejs-layouts');
const { machineIdSync: machineId } = require('node-machine-id');
const mongoose = require('../../models');
const path = require('path');
const pino = require('express-pino-logger')({ level: process.env.LOG_LEVEL });
const QueryString = require('libqs');
const session = require('express-session');

const app = express();
const ConnectRedis = require('connect-redis')(session);
const hardware = machineId();

const PrinterModel = mongoose.model('Printer');
const SettingModel = mongoose.model('Setting');

const locales = [ 'tr', 'en' ];
i18n.configure({
    locales,
    updateFiles: false,
    objectNotation: true,
    directory: `${ __dirname }/../../i18n/app`
});

app.set('views', path.join(__dirname, '../../views'));
app.set('view engine', 'ejs');
app.use(express.static(path.join(__dirname, '../../public')));

app.use(helmet());
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(session({
    store: new ConnectRedis({ host: process.env.REDIS_HOST, port: process.env.REDIS_PORT, ttl: 3600 }),
    resave: true,
    secret: 'h5mGMK7ZENqXueJpjXf5gYjYeXfunbQun7RCgAjErDSkyZsr',
    saveUninitialized: true,
    cookie: { maxAge: 3600000 }
}));
app.use(require('flash')());
app.use(layout);
app.use(pino);
app.use(i18n.init);

app.use(function (req, res, next) {
    req.query.ts = Date.now();
    res.locals.$date = formatDate;
    res.locals.$hardware = hardware;
    res.locals.$license = {};
    res.locals.$printer = {};
    res.locals.$qs = new QueryString();
    res.locals.$qs.overwrite(req.query);
    res.locals.$sys = {};
    if (!req.url.includes('?')) res.locals.$url = req.url.substr(1);
    else res.locals.$url = req.url.substr(1, req.url.indexOf('?') - 1) || '';
    if (req.headers['x-forwarded-for'] && req.headers['x-forwarded-for'].length) {
        try {
            req.realIP = req.headers['x-forwarded-for'].split(',')[0].trim();
        } catch (e) {
            req.realIP = req.headers['x-real-ip'] || req.headers['x-forwarded-for'];
        }
    } else {
        req.realIP = req.headers['x-real-ip'] || req.headers['x-forwarded-for'];
    }
    if (!req.realIP) req.realIP = req.connection.remoteAddress;
    if (req.realIP && req.realIP.substr(0, 7) === '::ffff:') req.realIP = req.realIP.substr(7);
    if (req.realIP === '::1') req.realIP = '127.0.0.1';
    next();
});

app.use(async function (req, res, next) {
    try {
        const system = await Configuration.system();
        if (is.not.object(system) && is.empty(system)) throw new Error('invalid system');

        if (locales.includes(system.language)) res.setLocale(system.language);
        res.locals.$sys = system;
        next();
    } catch (e) {
        next();
    }
});

app.use(async function (req, res, next) {
    try {
        const printer = await PrinterModel.single({ ip: req.realIP });
        if (printer && !printer.deleted) {
            if (printer.options && locales.includes(printer.options.language)) res.setLocale(printer.options.language);
            printer.seen = Date.now();
            await printer.save();
            res.locals.$printer = printer;
            next();
        } else {
            req.flash('danger', res.__('txt.printer', req.realIP));
            res.locals.$printer = undefined;
            next();
        }
    } catch (e) {
        res.locals.$printer = undefined;
        next();
    }
});

app.use(async function (req, res, next) {
    try {
        const setting = await SettingModel.single({ name: 'license' });
        if (setting && is.string(setting.value) && is.not.empty(setting.value))
            res.locals.$license = auth.verify(setting.value);
        if (!res.locals.$license || res.locals.$license.hardware !== hardware) {
            req.flash('danger', res.__('txt.license.hardware'));
            res.locals.$license = undefined;
        } else if ((new Date(res.locals.$license.date)).getTime() < (new Date()).getTime()) {
            req.flash('danger', res.__('txt.license.date'));
            res.locals.$license = undefined;
        }
        next();
    } catch (e) {
        req.flash('danger', res.__('txt.license.date'));
        res.locals.$license = undefined;
        next();
    }
});

app.use('/', require('./home'));

module.exports = app;
