var request = require('request');

var url = 'https://developers.zomato.com/api/v1/search?entity_id=74&entity_type=city&start=0&count=20&cuisines=237&sort=cost&order=asc';
var url2 = 'http://localhost:3001/api/card/register'
request.post({
  url: url2,
  headers: {
    'X-Auth': '8f2190111e43414a7758d3f8360fe334'
  },
  body: {}
}, function(err, response, body) {
    console.log('huba');
    // console.log(response);
});


curl -H "X-Auth: 8f2190111e43414a7758d3f8360fe334" -X POST -d '{"username":"xyz","password":"xyz"}' http://localhost:3001/api/card
