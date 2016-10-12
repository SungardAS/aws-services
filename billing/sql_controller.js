'use strict';

let kms = require('../lib/aws_promise/kms');
let pgp = require('pg-promise')();
let dateformat = require('dateformat');

module.exports = {

  get: function(params) {

    var fs = require("fs");
    var data = fs.readFileSync(__dirname + '/json/default.json', {encoding:'utf8'});
    var data_json = JSON.parse(data);

    let kmsRegion = data_json.kmsRegion;
    let redshiftConnectionString = data_json.redshiftConnectionString;
    let redshiftUser = data_json.redshiftUser;
    let redshiftPass = data_json.redshiftPass;

    var input = {
      region: kmsRegion,
      password: redshiftPass
    };
    return kms.decrypt(input).then(function(data) {
      redshiftPass = data.Plaintext.toString();
      redshiftConnectionString = 'pg:' + redshiftUser + ':' + redshiftPass + '@' + redshiftConnectionString;
    }).then(function() {
      // now run the sql in the redshift
      var connection = pgp(redshiftConnectionString);
      return connection.query(params.sql).then(function(result) {
  			console.log(result);
        pgp.end();
        return result;
      });
    });
  }
}
