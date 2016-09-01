'use strict';

let AWS = require('aws-sdk');
let pg = require('pg');
let PgPromise = require('pgpromise');

exports.handler = (event, context, callback) => {

  console.log('Received event:', JSON.stringify(event, null, 2));

  var fs = require("fs");
  var data = fs.readFileSync(__dirname + '/json/default.json', {encoding:'utf8'});
  var data_json = JSON.parse(data);

  let bucketRegion = data_json.bucketRegion;
  let redshiftConnectionString = data_json.redshiftConnectionString;
  let redshiftUser = data_json.redshiftUser;
  let redshiftPass = data_json.redshiftPass;

  var kms = new AWS.KMS({region:bucketRegion});
  var params = {
    CiphertextBlob: new Buffer(redshiftPass, 'base64')
  };
  kms.decrypt(params).promise().then(function(data) {
    redshiftPass = data.Plaintext.toString();
    redshiftConnectionString = 'pg:' + redshiftUser + ':' + redshiftPass + '@' + redshiftConnectionString;
  }).then(function() {
    // now run the sql in the redshift
    var connection = null;
  	var db = new PgPromise(pg, redshiftConnectionString);
  	db.connect().then(function(conn) {
      connection = conn;
      return connection.client.queryP(event.sql).then(function(result) {
  			console.log(result);
        connection.client.end();
        callback(null, result);
  		}).catch(function(err) {
        console.log(err);
        if (connection) connection.client.end();
        callback(err);
      });
    }).catch(function(err) {
      console.log(err);
      if (connection) connection.client.end();
      callback(err);
    });
  }).catch(function(err) {
    console.log(err);
    callback(err);
  });
};
