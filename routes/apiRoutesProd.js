var express = require('express');
var router = express.Router();
var apiController = require('../controllers/apiController');

router.post('/charge', apiController.doChargeProd);

router.get('/card', apiController.getCards);

router.delete('/card/:saved_token_id', apiController.deleteCard)

router.post('/card/register', apiController.registerCard);

router.post('/auth', apiController.generateAuth);

router.get('/checkauth', apiController.checkauth);

router.get('/ping', apiController.getPing);

router.post('/ping', apiController.postPing);

module.exports = router;
