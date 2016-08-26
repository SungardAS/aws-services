'use strict';
console.log('Loading function');

var collector = require('./instance_attr_collector');
var builder = require('./spotinst_json_builder');

exports.handler = (event, context, callback) => {

  console.log('Received event:', JSON.stringify(event, null, 2));

  var accessKey = event.spotinstAccessKey;

  collector.getEC2InstanceAttrs(event.instanceId, event.region).then(function(instance) {
    console.log(JSON.stringify(instance, null, 2));
    var json = builder.build(instance, event.name, event.description, event.keyPairName, JSON.parse(event.tags));
    console.log(JSON.stringify(json, null, 2));
    if (event.dryRun) {
      callback(null, json);
    }
    else {
      builder.deploy(json, accessKey).then(function(data) {
        console.log("Spotinst was successfully deployed : " + data);
        callback(null, data);
      });
    }
  }).catch(function(err) {
    console.log(err);
    callback(err);
  });
};
