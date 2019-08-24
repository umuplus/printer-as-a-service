'use strict';

const express = require('express');
const router = express.Router();

const Controller = require('./controller.class');

router.get('/', Controller.index);
router.get('/:job/download', Controller.download);
router.get('/:username/copy', Controller.copy);
router.get('/:username/custom', Controller.custom);
router.get('/:username/print', Controller.print);
router.get('/:username/scan', Controller.scan);
router.post('/:jid/:job/pair', Controller.pair);
router.post('/template', Controller.template);
router.post('/:username/:job/remove', Controller.remove);
router.post('/:username/claim', Controller.claim);
router.post('/:username/unclaim', Controller.unclaim);

module.exports = router;
