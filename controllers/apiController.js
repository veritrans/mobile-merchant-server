var request = require('request');
var crypto = require('crypto');
var NodeCache = require( "node-cache" );
var myCache = new NodeCache({ stdTTL: 86400, checkperiod: 12000 });

exports.doCharge = function(req, res, next) {
  var reqBody = req.body;
  // res.send(reqBody);
  // console.log('Charging request', reqBody);
  // console.log("huba");

  var chargeToken = 'Basic ' + new Buffer('VT-server-LOpE7O8_7niPnHylBjBz9xxx:').toString('base64'); // Dummy Charge Token
  var url = "https://app.sandbox.midtrans.com/snap/v1/transactions";

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

exports.doChargeProd = function(req, res, next) {
  var reqBody = req.body;
  // res.send(reqBody);
  // console.log('Charging request', reqBody);
  // console.log("huba");

  var chargeToken = 'Basic ' + new Buffer('b4fe7a0e-f784-4d75-8f9f-2556e9b37a97:').toString('base64');
  var url = 'https://app.midtrans.com/snap/v1/transactions';

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

exports.checkauth = function(req,res) {
  var token = req.headers['x-auth'];

  if(checkTokenValidity(token)){
    res.status(200).json({"status_code": 200,"status_message": "Token is valid"});
  }else{
    res.status(403).json({"status_code": 403,"status_message": "Token is invalid"});
  }

}

exports.deleteCard = function(req, res) {
//   "saved_token_id": "411111dae1ff06-cdd6-4ea0-af19-cd04b68ada21",
  var token = req.headers['x-auth'];

  if(req.params.saved_token_id && token){

    var tokenList = getTokenList();
    var isTokenValid = checkTokenValidity(token);

    if(isTokenValid){
      var oldCardList = getSavedCards(token);
      var newCardList = [];

      var cardFound = false;
      for (var i = 0; i < oldCardList.length; i++) {
        if(oldCardList[i].saved_token_id == req.params.saved_token_id){
          cardFound = true;
        }else{
          newCardList.push(oldCardList[i]);
        }
      }

      if(cardFound){
        var success = myCache.set(token, newCardList);
        if(success){
          res.status(200).json({"status_code": 200,"status_message": "Card is delted"});
        }else{
          res.status(500).json({"status_code": 500,"status_message": "Internal Server Error"});
        }
      }else{
        res.status(404).json({"status_code": 404,"status_message": "Card is not found"});
      }



    }else{
      res.status(403).json({"status_code": 403,"status_message": "Invalid X-Auth token"});
    }
  }else{
    if(!token){
      res.status(403).json({"status_code": 403,"status_message": "Invalid X-Auth token"});
    }else{
      res.status(404).json({"status_code": 404,"status_message": "Card not found"});
    }
  }
}

exports.registerCard = function(req, res) {
//   {
//   "status_code": "200",
//   "transaction_id": "4b62f405-34c2-4574-87fd-18731b8d4ce8",
//   "saved_token_id": "411111dae1ff06-cdd6-4ea0-af19-cd04b68ada21",
//   "masked_card": "411111-1111"
// }
  var token = req.headers['x-auth'];

  if(req.body.status_code == 200 && req.body.saved_token_id && req.body.masked_card && token){

    var tokenList = getTokenList();
    var isTokenValid = checkTokenValidity(token);

    if(isTokenValid){
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
          res.status(201).json({"status_code": 201,"status_message": "Card is saved"});
        }else{
          res.status(208).json({"status_code": 208,"status_message": "Card is already saved"});
        }
      }else{
        res.status(500).json({"status_code": 500,"status_message": "Internal Server Error"});
      }
    }else{
      res.status(403).json({"status_code": 403,"status_message": "Invalid X-Auth token"});
    }
  }else{
    if(!token){
      res.status(403).json({"status_code": 403,"status_message": "Invalid X-Auth token"});
    }else{
      res.status(400).json({"status_code": 400,"status_message": "status_code dari papi harus 200, harus ada saved_token_id, harus ada masked_card"});
    }
  }
}

exports.getCards = function(req, res, next) {
  var token = req.headers['x-auth'];
  if(token){

    var tokenList = getTokenList();
    var isTokenValid = checkTokenValidity(token);

    if(isTokenValid){
      var cardList = getSavedCards(token);
      if(!cardList){
        cardList = [];
      }
    }else{
      res.status(403).json({"status_code": 403,"status_message": "Invalid X-Auth token"});
    }
  }else{
    res.status(403).json({"status_code": 403,"status_message": "Invalid X-Auth token"});
  }

  var response = {
    'status_code' : 200,
    'status_message' : 'success',
    'data' : cardList
  }
  res.json(response);
};

exports.generateAuth = function(req, res) {
  var now = new Date();
  var hash = crypto.createHash('md5').update(now.toUTCString()).digest('hex');
  response = {'X-Auth': hash}

  var tokenList = getTokenList();

  if(!tokenList){
    tokenList = [];
  }

  tokenList.push(hash);

  var success = myCache.set('tokenList', tokenList);

  if(success){
    res.json(response);
  }else{
    res.status(500).json({"status_code": 500,"status_message": "Internal Server Error"});
  }

}

function getTokenList(){
  value = myCache.get( 'tokenList' );
  if ( value == undefined ){
    return [];
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

function checkTokenValidity(token){
  var tokenList = getTokenList();
  var isTokenValid = false;
  for (var i = 0; i < tokenList.length; i++) {
    if(tokenList[i] == token){
      isTokenValid = true;
      break;
    }
  }
  return isTokenValid;
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
