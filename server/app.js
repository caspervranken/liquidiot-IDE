/**
 * Copyright (c) TUT Tampere University of Technology 2015-2016
 * All rights reserved.
 *
 * Main author(s):
 * Antti Nieminen <antti.h.nieminen@tut.fi>
 */

'use strict';

if (!process.env.NODE_ENV) {
  console.log("\n*****************************************");
  console.log("No NODE_ENV environment variable defined!");
  console.log("Please define it. Exiting now...");
  console.log("*****************************************\n");
  process.exit(1);
}

var bodyParser = require('body-parser');

var express = require('express');
var mongoose = require('mongoose');
var config = require('./config/environment');

// Connect to database
mongoose.connect(config.mongo.uri, config.mongo.options);
mongoose.connection.on('error', function(err) {
	console.error('MongoDB connection error: ' + err);
	process.exit(-1);
	}
);
// Populate DB with sample data
if(config.seedDB) { require('./config/seed'); }

// Setup server
var app = express();

// These twi lines is added to increase the payload size.
// Otherwise it throws payload too large  error
app.use(bodyParser.json({limit: '50mb'}));
app.use(bodyParser.urlencoded({limit: '50mb', extended: true}));

app.use(express.static(__dirname + "/public"));
var server = require('http').createServer(app);
require('./config/express')(app);
require('./routes')(app);

// Start server
server.listen(config.port, config.ip, function () {
  console.log('Express server listening on %d, in %s mode', config.port, app.get('env'));
});

// Expose app
exports = module.exports = app;
