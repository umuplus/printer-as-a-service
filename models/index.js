'use strict';

const mongoose = require('mongoose');

mongoose.Promise = global.Promise;
mongoose.set('debug', process.env.MONGODB_DEBUG === 'true');
mongoose.connect(process.env.MONGODB_URL, { useCreateIndex: true, useNewUrlParser: true })
    .catch(e => console.error(e));

require('./model');
require('./printer');
require('./setting');
require('./user');

module.exports = mongoose;
