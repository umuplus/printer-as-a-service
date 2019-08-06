'use strict';

const express = require('express');
const is = require('is_js');
const router = express.Router();

const Controller = require('./controller.class');

router.use(function (req, res, next) {
    if (!res.locals.$user || is.empty(res.locals.$user) || res.locals.$user.level < res.locals.$privileges.admin)
        return res.redirect(`/sign-in?ts=${ res.locals.$qs.val('ts') }`);

    res.locals.$module = 'users';
    next();
});

router.get('/', Controller.list);

router.get('/create', Controller.create);
router.post('/create', Controller.create);

router.get('/:id/edit', Controller.edit);
router.post('/:id/edit', Controller.edit);

router.get('/:id/trash', function (req, res) {
    Controller.status(req, res, false);
});

router.get('/:id/restore', function (req, res) {
    Controller.status(req, res, true);
});

module.exports = router;
