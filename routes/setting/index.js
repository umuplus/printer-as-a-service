'use strict';

const express = require('express');
const is = require('is_js');
const router = express.Router();

const Controller = require('./controller.class');

router.use(function (req, res, next) {
    if (!res.locals.$user || is.empty(res.locals.$user) || res.locals.$user.level < res.locals.$privileges.master)
        return res.redirect(`/?ts=${ res.locals.$qs.val('ts') }`);

    res.locals.$module = 'settings';
    next();
});

router.get('/', Controller.list);

router.get('/create', Controller.create);
router.post('/create', Controller.create);

router.get('/:id/edit', Controller.edit);
router.post('/:id/edit', Controller.edit);

router.get('/license', Controller.license);
router.post('/license', Controller.license);

router.get('/:id/remove', Controller.remove);

module.exports = router;
