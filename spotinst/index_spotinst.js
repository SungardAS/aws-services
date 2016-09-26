'use strict';
console.log('Loading function');

var AWS = require('aws-sdk');
var collector = require('./instance_attr_collector');
var builder = require('./spotinst_json_builder');

exports.handler = (event, context, callback) => {

  console.log('Received event:', JSON.stringify(event, null, 2));

  var federateRoleArn = event.federateRoleArn;
  var accountRoleArn = event.accountRoleArn;
  var externalId = event.externalId;
  var accessKey = event.spotinstAccessKey;

  assumeRole(federateRoleArn, accountRoleArn, externalId).then(function(creds) {
    collector.getEC2InstanceAttrs(event.instanceId, event.region, creds).then(function(instance) {
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
  });
};

function assumeRole(federateRoleArn, accountRoleArn, externalId) {
  if (!federateRoleArn) return new Promise(function(resolve, reject) {
    resolve(null);
  });
  var sts = new AWS.STS({});
  var params = {
    RoleArn: federateRoleArn,
    RoleSessionName: 'session'
  };
  return sts.assumeRole(params).promise().then(function(data) {
    console.log(data);
    var creds = new AWS.Credentials({
      accessKeyId: data.Credentials.AccessKeyId,
      secretAccessKey: data.Credentials.SecretAccessKey,
      sessionToken: data.Credentials.SessionToken
    });
    sts = new AWS.STS({credentials: creds});
    params = {
      RoleArn: accountRoleArn,
      ExternalId: externalId,
      RoleSessionName: 'session'
    };
    return sts.assumeRole(params).promise().then(function(data) {
      console.log(data);
      creds = new AWS.Credentials({
        accessKeyId: data.Credentials.AccessKeyId,
        secretAccessKey: data.Credentials.SecretAccessKey,
        sessionToken: data.Credentials.SessionToken
      });
      return creds;
    });
  });
}
