
var inherits = require('util').inherits;
var FlowController = require('../flow_controller');
var AWS = require('aws-sdk');

function DynamoDB() {

  FlowController.call(this);

  var me = this;

  me.findService = function(input) {
    var params = {region:input.region};
    if (input.creds)  params.credentials = input.creds;
    else if (input.profile) {
      var credentials = new AWS.SharedIniFileCredentials({profile: input.profile});
      AWS.config.credentials = credentials;
    }
    var dynamodb = new AWS.DynamoDB(params);
    console.log(dynamodb);
    return dynamodb;
  }

  me.save = function(input, callback) {

    console.log(input.item);
    var params = {
      "TableName": input.tableName,
      "Item" : input.item
    };
    var self = arguments.callee;

    if (callback) {
      var dynamodb = me.findService(input);
      dynamodb.putItem(params, callback);
      return;
    }

    var dynamodb = me.preRun(self, input);
    dynamodb.putItem(params, me.callback);
  }
}

module.exports = DynamoDB
