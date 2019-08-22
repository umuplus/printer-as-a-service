'use strict';

const express = require('express');
const router = express.Router();

const Controller = require('./controller.class');

router.get('/', Controller.index);
router.get('/:job/download', Controller.download);
router.post('/:username/claim', Controller.claim);
router.get('/:username/copy', Controller.copy);
router.get('/:username/custom', Controller.custom);
router.get('/:username/print', Controller.print);
router.get('/:username/scan', Controller.scan);
router.post('/:username/unclaim', Controller.unclaim);
router.post('/:username/:job/remove', Controller.remove);
router.post('/:jid/:job/pair', Controller.pair);

module.exports = router;
