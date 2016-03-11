var express = require('express');
var logger = require('morgan');
var bodyParser = require('body-parser');
var routes = require('./routes');
var app = express();

app.use(logger('dev'));
app.use(bodyParser.json());

app.use('/api', routes);


app.listen(3001, function () {
    console.log('listening on port', 3001);
});
