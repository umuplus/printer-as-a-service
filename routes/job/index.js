'use strict';

const express = require('express');
const is = require('is_js');
const router = express.Router();

const Controller = require('./controller.class');

router.use(function (req, res, next) {
    if (!res.locals.$user || is.empty(res.locals.$user)) return res.redirect(`/sign-in?ts=${ res.locals.$qs.val('ts') }`);

    res.locals.$module = 'jobs';
    next();
});

router.get('/', Controller.list);
router.get('/:id/remove', Controller.remove);

module.exports = router;
