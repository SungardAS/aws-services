'use strict';
console.log('Loading function');

var docClient = require('./dynamodb_document');

exports.handler = (event, context, callback) => {

  var main_region = event.Records[0].EventSubscriptionArn.split(":")[3];

  var messageJSON = JSON.parse(event.Records[0].Sns.Message);
  console.log('From SNS:', messageJSON);
  messageJSON.HashKey = messageJSON.Account + "." + messageJSON.Region + "." + messageJSON.InstanceId;
  //messageJSON.RangeKey = messageJSON.Metrics.Maximum;
  messageJSON.ReportedAt = new Date().toISOString();
  removeNullAttrs(messageJSON);

  var fs = require("fs");
  var config = fs.readFileSync(__dirname + '/config/config.json', {encoding:'utf8'});
  var config_json = JSON.parse(config);
  console.log(config_json);
  var dynamodbTableName = config_json['dynamodbTableName'];

  docClient.save(dynamodbTableName, messageJSON, main_region).then(function(ret) {
    console.log(ret);
    callback(null, ret);
  }).catch(function(err) {
    console.log(err);
    callback(err);
  });
};

function removeNullAttrs(obj) {
  if (!obj) return;
  Object.keys(obj).forEach(function(key) {
    var valueType = typeof(obj[key]);
    if ((valueType == "string" || valueType == "object") && !obj[key])  {
      console.log(key + " value is " + obj[key]);
      delete obj[key];
      return;
    }
    if (typeof(obj[key]) == "object") removeNullAttrs(obj[key]);
  });
}
