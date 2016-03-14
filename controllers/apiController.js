var request = require('request');
var crypto = require('crypto');
var NodeCache = require( "node-cache" );
var myCache = new NodeCache({ stdTTL: 3600, checkperiod: 600 });

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
    var respObj = parseJson(body);
    res.json(respObj);
  });

}

exports.registerCard = function(req, res) {
//   {
//   "status_code": "200",
//   "transaction_id": "4b62f405-34c2-4574-87fd-18731b8d4ce8",
//   "saved_token_id": "411111dae1ff06-cdd6-4ea0-af19-cd04b68ada21",
//   "masked_card": "411111-1111"
// }
  var token = req.headers['x-auth'];
  console.log(req);
  if(req.body.status_code == 200 && req.body.saved_token_id && req.body.masked_card && token){
    var cardList = getSavedCards(token);
    var card = {
      'saved_token_id' : req.body.saved_token_id,
      'masked_card' : req.body.masked_card
    }
    if(cardList){
      var cardAlreadySaved = false;
      for (var i = 0; i < cardList.length; i++) {
        if(cardList[i].saved_token_id == card.saved_token_id){
          cardAlreadySaved = true;
          break;
        }
      }
      if(!cardAlreadySaved){
        cardList.push(card);
      }
    }else{
      cardList = [card];
    }
    var success = myCache.set(token, cardList);

    if(success){
      if(!cardAlreadySaved){
        res.json({"code": 201,"status": "Success","message": "Card is saved"});
      }else{
        res.json({"code": 208,"status": "Success","message": "Card is already saved"});
      }
    }else{
      res.json({"code": 500,"status": "Server Error","message": "Internal Server Error"});
    }
  }else{
    if(!token){
      res.json({"code": 403,"status": "Forbidden","message": "Invalid X-Auth token"});
    }else{
      res.json({"code": 400,"status": "Bad Request","message": "status_code dari papi harus 200, harus ada saved_token_id, harus ada masked_card"});
    }
  }
}

exports.getCards = function(req, res, next) {
  var token = req.headers['x-auth'];
  if(token){
    var cardList = getSavedCards(token);
    if(!cardList){
      cardList = [];
    }
  }else{
    res.json({"code": 403,"status": "Forbidden","message": "Invalid X-Auth token"});
  }

  var response = {
    'code' : 200,
    'status' : 'success',
    'data' : cardList
  }
  res.json(response);
};

exports.getAuth = function(req, res) {
  var now = new Date();
  var hash = crypto.createHash('md5').update(now.toUTCString()).digest('hex');
  response = {'X-Auth': hash}
  res.json(response);
}

function getSavedCards(token){
  value = myCache.get( token );
  if ( value == undefined ){
    return false;
  }
  return value;
}

function getSavedCards(token){
  value = myCache.get( token );
  if ( value == undefined ){
    return false;
  }
  return value;
}

function parseJson(jsonString){
   var retObj = {}
   try {
       retObj = JSON.parse(jsonString);
   } catch (e) {
       return false;
   }
   return retObj;
}

exports.getPing = function(req, res) {
  res.send('Poing');
}

exports.postPing = function(req, res) {
  // console.log('----------------------------------------------------------------------------------------------------------------')
  // console.log(req);
  console.log(req.body);
  res.json(req.body);
}
