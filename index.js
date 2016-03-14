var express = require('express');
var logger = require('morgan');
var bodyParser = require('body-parser');
var apiRoutes = require('./routes/apiRoutes');
var indexRoutes = require('./routes/indexRoutes');
var app = express();

app.use(logger('dev'));
app.use(bodyParser.json());

app.use('/api', apiRoutes);

app.use('/', indexRoutes);


app.listen(3001, function () {
    console.log('listening on port', 3001);
});
