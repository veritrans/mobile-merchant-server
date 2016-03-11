var express = require('express');
var router = express.Router();
var apiController = require('../lib/apiController');
var gcm = require('../lib/gcm');

/* GET home page. */
router.post('/purchase', apiController.storePurchase);

/* Register device */
router.post('/register', apiController.registerDevice);

/* Charge API call */
// router.post('/charge', [
//   apiController.isTokenValid,
//   apiController.charge,
//   apiController.insertCharge
// ]);

router.post('/charge', apiController.doCharge);

/* Cancel Transaction */
router.post('/:id/cancel', [
  apiController.isTokenValid,
  apiController.findTransaction,
  apiController.cancelTransaction
]);

router.post('/unfinish', apiController.rawResponse);
router.post('/error', apiController.rawResponse);

/* Payment Status */
router.post('/paymentstatus', apiController.updateStatusOfStoredDocument);

/* Receive http post notifications */
router.post('/notification', apiController.receivePush);

/* Add card details */
// router
//   .route('/card')
//   .all(apiController.isTokenValid)
//   .post(apiController.storeCard)
//   .get(apiController.getCards);
router.get('/card', apiController.getCards);

router.post('/card/register', apiController.registerCard);

/* Delete Card */
router.post('/card/delete', apiController.isTokenValid, apiController.deleteCard);

/* offers */
router.get('/offers', apiController.offers);

/* saveCC / Register Card */
// router.post('/creditcard', apiController.saveCC);
// router.get('/creditcard', apiController.getCC);

/* Auth */
router.post('/auth', apiController.getAuth);

router.post('/coba', function(req,res){console.log(req);res.json(req.body)});

module.exports = router;
