'use strict';

const express = require('express');
const router = express.Router();

const Controller = require('./controller.class');

router.get('/', Controller.index);

router.get('/lang/:lang', Controller.language);

router.get('/sign-in', Controller.login);
router.post('/sign-in', Controller.login);

router.get('/sign-out', Controller.logout);

module.exports = router;
