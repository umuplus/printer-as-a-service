'use strict';

const auth = require('../lib/auth');
const cookieParser = require('cookie-parser');
const express = require('express');
const formatDate = require('date-fns/format');
const helmet = require('helmet');
const i18n = require('i18n');
const layout = require('express-ejs-layouts');
const mongoose = require('../models');
const parseDate = require('date-fns/parse');
const path = require('path');
const pino = require('express-pino-logger')({ level: process.env.LOG_LEVEL });
const QueryString = require('libqs');
const session = require('express-session');

const app = express();
const ConnectRedis = require('connect-redis')(session);
const UserModel = mongoose.model('User');

const locales = [ 'tr', 'en' ];
i18n.configure({
    locales,
    updateFiles: false,
    objectNotation: true,
    directory: `${ __dirname }/../i18n`
});

app.set('views', path.join(__dirname, '../views'));
app.set('view engine', 'ejs');
app.use(express.static(path.join(__dirname, '../public')));

app.use(helmet());
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(session({
    store: new ConnectRedis({ host: process.env.REDIS_HOST, port: process.env.REDIS_PORT, ttl: 86400 }),
    resave: true,
    secret: 'TZDfRnFZ8KBq7XANufcakdqX9cF9jwrKK5Z6FpFKXfQbNnJP',
    saveUninitialized: true,
    cookie: { maxAge: 86400000 }
}));
app.use(require('flash')());
app.use(layout);
app.use(pino);
app.use(i18n.init);

app.use(function (req, res, next) {
    req.$user = {};
    req.query.ts = Date.now();
    res.locals.$date = formatDate;
    res.locals.$module = 'home';
    res.locals.$parse = parseDate;
    res.locals.$qs = new QueryString();
    res.locals.$qs.overwrite(req.query);
    if (!req.url.includes('?')) res.locals.$url = req.url.substr(1);
    else res.locals.$url = req.url.substr(1, req.url.indexOf('?') - 1) || '';
    res.locals.$uri = req.originalUrl;
    res.locals.$user = req.$user;
    if (req.headers['x-forwarded-for'] && req.headers['x-forwarded-for'].length) {
        try {
            req.realIP = req.headers['x-forwarded-for'].split(',')[0].trim();
        } catch (e) {
            req.realIP = req.headers['x-real-ip'] || req.headers['x-forwarded-for'];
        }
    } else {
        req.realIP = req.headers['x-real-ip'] || req.headers['x-forwarded-for'];
    }
    if (locales.includes(req.session.lang)) res.setLocale(req.session.lang);
    res.locals.$lang = res.getLocale();
    next();
});

app.use(async function (req, res, next) {
    try {
        const data = auth.verify(req.session.token);
        const user = await UserModel.single({ email: data.email });
        if (user && !user.deleted) {
            req.$user = user;
            res.locals.$user = user;
        }
        next();
    } catch (e) {
        next();
    }
});

app.use('/', require('./home'));
app.use('/users', require('./user'));

module.exports = app;
