var db = require('../lib/db');
var hat = require('hat');
var request = require('request');
var gcm = require('./gcm').GCM;
var _ = require('lodash');

exports.storePurchase = function(req, res, next) {
  var body = req.body;

  db.transactions.insert(body, function(err) {
    if(err) {
      return next(err);
    }

    return next();
  });
}

/**
 * DEVICE TOKEN REGISTRATION
 * ==========================
 *
 * Required old device ID or new ID or both.
 * If both device ID's are there, then need to pass unique identifier
 * which is `token` in our case.
 *
 */

exports.registerDevice = function(req, res, next) {
  var body = req.body;
  var token = req.headers['x-auth'];

  if(!body.oldRegistrationId && !body.registrationId) {
    return next(new Error('Registration ID required'));
  }

  if(body.oldRegistrationId && !body.registrationId) {
    return next(new Error('Registration ID required'));
  }

  /**
   * Check that device token is alredy registered with merchant or not.
   * @param  {[type]}  body.registrationId [description]
   * @param  {[type]}  function(err        [description]
   * @return {Boolean}                     [description]
   */
  isDeviceAlreadyRegistered(body.registrationId, function(err) {
    if(err) {
      return next(err);
    }

    if(body.oldRegistrationId && body.registrationId) {
      if(!token) {
        return next(new Error('Unauthorized'));
      }

      /**
       * Check token validity
       * @param  {[type]} token        [description]
       * @param  {[type]} function(err [description]
       * @return {[type]}              [description]
       */
      validateToken(token, function(err) {
        if(err) {
          return next(err);
        }

        /**
         * Find old device exist in system or not
         */
        db.devices.findOne({
          device: body.oldRegistrationId
        }, function(err, device) {
          if(err) {
            return next(err);
          }

          if(!device) {
            return next(new Error('oldRegistrationId - not registered'));
          }

          /**
           * Update new ID with old device ID
           */
          db.devices.update({
            _id: device._id
          }, {
            '$set': {
              device: body.registrationId
            }
          }, function(err) {
            if(err) {
              return next(err);
            }
            next();
          });
        });
      });
    } else {
      /**
       * Register new device
       */
      var token = hat();
      db.devices.insert({
        token: token,
        device: body.registrationId
      }, function(err) {
        if(err) {
          return next(err);
        }

        req.store.data = {
          token: token
        };

        next();
      });
    }
  });
}

/**
 * Validate token.
 */
exports.isTokenValid = function(req, res, next) {
  var token = req.headers['x-auth'];

  if(!token) {
    return next(new Error('Unauthorized'));
  }

  validateToken(token, function(err) {
    if(err) {
      return next();
    }

    req.store.token = token;
    next();
  });
};

/**
 * Charge
 */
exports.charge = function(req, res, next) {
  var token = req.store.token;
  var chargeToken = 'Basic ' + new Buffer(process.env.SERVER_KEY).toString('base64');
  var body = req.body;

  if(!req.body) {
    return next(new Error('Charge parameters are missing'));
  }

  request({
    url: process.env.CHARGE_URL,
    method: 'POST',
    json: body,
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      'Authorization': chargeToken
    }
  }, function(err, response, body) {
    req.store.data = body;
    next();
    // if (!err && response.statusCode == 200) {
    //   if(parseInt(body.status_code, 10) < 200 || parseInt(body.status_code, 10) > 202) {
    //     return next(new Error(body.status_message));
    //   }
    //   req.store.data = body;
    //   next();
    // } else {
    //   return next(err);
    // }
  });
};

exports.receivePush = function(req, res, next) {
  var body = req.body;
  var skipType = ['mandiri_clickpay', 'credit_card', 'indosat_dompetku'];

  if(skipType.indexOf(body.payment_type) !== -1 && body.transaction_status === 'cancel') {
    return next();
  }

  var pushParams = {
    sm: body.status_message,
    ti: body.transaction_id,
    ga: body.gross_amount,
    oi: body.order_id,
    pt: body.payment_type,
    tt: body.transaction_time,
    ts: body.transaction_status,
    sc: body.status_code
  };

  if(parseInt(body.status_code) < 200 || parseInt(body.status_code) > 201) {
    pushParams.ts = 'fail';
  }

  db.transactions.findOne({
    transaction_id: pushParams.ti,
    order_id: pushParams.oi,
    gross_amount: pushParams.ga,
    payment_type: pushParams.pt
  }, function(err, transaction) {
    if(err) {
      console.error(err);
      return next();
    }

    if(!transaction) {
      console.error(err);
      return next();
    }

    if(
      transaction.transaction_status === body.transaction_status ||
      transaction.redirect_url
    ) {
      return next();
    }


    db.devices.findOne({
      token: transaction.token
    }, function(err, device) {
      if(err) {
        console.error(err);
        return next();
      }

      gcm.sendPush([device.device], pushParams, function(err, data) {
        if(err) {
          console.log(err);
          return next();
        }

        console.log(data);
        next();
      });
    });
  });
};

/**
 * Put charge in database
 */
exports.insertCharge = function(req, res, next) {
  var token = req.store.token;
  req.store.data.token = token;
  db.transactions.insert(req.store.data, function(err) {
    if(err) {
      return next(err);
    }

    next();
  });
};

/**
 * Update charge
 */

exports.updateStatusOfStoredDocument = function(req, res, next) {
  var body = req.store.data = JSON.parse(req.body.response);
  db.transactions.findOne({
    order_id: body.order_id,
    transaction_id: body.transaction_id
  }, function(err, transaction) {
    if(err) {
      return next(err);
    }
    var update = _.merge(transaction, body);
    update = _.omit(update, 'redirect_url');
    db.transactions.save(update, function(err) {
      if(err) {
        return next(err);
      }

      res.locals.paymentStatus = JSON.stringify(body);
      return res.render('index', res.locals);
    });
  });
}

exports.storeCard = function(req, res, next) {
  var token = req.store.token;
  var body = req.body;

  if(
    !body.cardNumber ||
    !body.cardExpiryMonth ||
    !body.cardExpiryYear ||
    !body.cardType ||
    !body.savedTokenId
  ) {
    return next(new Error('Invalid card information'));
  }

  db.cards.count({
    'token': token,
    'cardNumber': body.cardNumber
  }, function(err, count) {
    if(err) {
      return next(err);
    }

    if(count > 0) {
      return next(new Error('Card already registered'));
    }

    db.cards.insert({
      cardNumber: body.cardNumber,
      cardExpiryMonth: body.cardExpiryMonth,
      cardExpiryYear: body.cardExpiryYear,
      secure: body.secure,
      twoClick:  body.twoClick,
      bank: body.bank,
      cardType:   body.cardType,
      savedTokenId: body.savedTokenId,
      token: token
    }, function(err) {
      if(err) {
        return next(err);
      }

      next();
    });
  });
};

exports.getCards = function(req, res, next) {
  var response = '{"error":"error message","message":"response message","cards":[{"cardNumber":"4111111111111111","cardCvv":123,"cardExpiryMonth":12,"cardExpiryYear":20,"grossAmount":120000}]}'
  res.send(response);
  // var token = req.store.token;
  //
  // db.cards.find({
  //   token: token
  // }).toArray(function(err, cards) {
  //   if(err) {
  //     return next(err);
  //   }
  //
  //   req.store.data = {cards: cards} || {cards: []};
  //   next();
  // });
};

exports.deleteCard = function(req, res, next) {
  var token = req.store.token;
  var body = req.body;

  var query = {token: token};

  if(body.cardNumber) {
    query.cardNumber = body.cardNumber;
    query.cardExpiryMonth = body.cardExpiryMonth;
    query.cardExpiryYear = body.cardExpiryYear;
    query.bank = body.bank;
  }

  db.cards.remove(query, function(err) {
    if(err) {
      return next(err);
    }

    next();
  });
};

exports.findTransaction = function(req, res, next) {
  var token = req.store.token;
  var id = req.params.id;

  if(!id) {
    return next(new Error('Transaction or Order Id is missing'));
  }

  db.transactions.findOne({
    token: token,
    '$or': [{
      'transaction_id': id
    }, {
      'order_id': id
    }]
  }, function(err, transaction) {
    if(err) {
      return next(err);
    }

    if(!transaction) {
      return next(new Error('Transaction or Order Id is invalid'));
    }

    req.store.transaction = transaction;
    next();
  });
};

exports.cancelTransaction = function(req, res, next) {
  var token = req.store.token;
  var transaction = req.store.transaction;
  var id = req.params.id;
  var chargeToken = 'Basic ' + new Buffer(process.env.SERVER_KEY).toString('base64');
  var url = process.env.BASE_URL + '/' + id + '/cancel';

  request({
    url: url,
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      'Authorization': chargeToken
    }
  }, function(err, response, body) {
    if (!err && response.statusCode == 200) {
      if(parseInt(body.status_code, 10) < 200 || parseInt(body.status_code, 10) > 202) {
        return next(new Error(body.status_message));
      }

      db.transactions.save(_.merge(transaction, JSON.parse(body)), function(err) {
        if(err) {
          return next(err);
        }

        req.store.data = JSON.parse(body);
        next();
      });
    } else {
      next(err);
    }
  });
};

exports.rawResponse = function(req, res, next) {
  var body = req.body;
  req.store.data = JSON.parse(body);
  next();
};

exports.offers = function(req, res, next) {
  req.store.data = {
    offers: [{
      "offer name" : "Get 10% cashback",
      "bins" :  ["48111111", "3111", "5", "bni", "mandiri"]
    },{
      "offer name" : "Get 5% cashback",
      "bins" :  ["52111111", "4311", "4", "bni"]
    }]
  };

  next();
};

exports.doCharge = function(req, res, next) {
  var reqBody = req.body;
  // res.send(reqBody);
  // console.log('Charging request', reqBody);
  // console.log("huba");

  var chargeToken = 'Basic ' + new Buffer('VT-server-XKXAv5HUYS7SgG6C4Ty4mbog').toString('base64');
  var url = 'https://api.sandbox.veritrans.co.id/v2' + '/charge';

  request.post({
    url: url,
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      'Authorization': chargeToken
    },
    body: JSON.stringify(reqBody)
  }, function(err, response, body) {
    // console.log('err', err);
    // console.log('response', response);
    // console.log('-------------------------');
    // console.log(reqBody.toString());
    res.send(body.toString());
    // res.send('achoo');
  });

}

exports.registerCard = function(req, res, next) {
  res.send(JSON.stringify(req.body));
}

/**
 * Validate token
 */
function validateToken(token, cb) {
  db.devices.count({
    token: token
  }, function(err, count) {
    if(err) {
      return cb(err);
    }

    if(count === 0) {
      return cb(new Error('Invalid token submitted'));
    }

    return cb(null);
  });
}

/**
 * Check device is registered or not
 */

function isDeviceAlreadyRegistered(device, cb) {
  db.devices.count({
    device: device
  }, function(err, count) {
    if(err) {
      return cb(err);
    }

    if(count > 0) {
      return cb(new Error('Device token alredy registered'));
    }

    cb();
  });
}
