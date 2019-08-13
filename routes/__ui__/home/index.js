'use strict';

const express = require('express');
const router = express.Router();

const Controller = require('./controller.class');

router.get('/', Controller.index);
router.post('/jobs', Controller.jobs);

module.exports = router;
