var express = require('express');
var router = express.Router();

router.get('/', function(req, res) {res.send("These aren't the Droids your looking for, move along")});

module.exports = router;
