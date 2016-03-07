'use strict';

var mongojs = require('mongojs');
var connectionURL = process.env.DB || 'veritrans';

var dbs = ['transactions', 'devices', 'cards'];
var db;

if(!db) {
  db = mongojs(connectionURL, dbs);
}

exports = module.exports = db;
