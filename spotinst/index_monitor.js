'use strict';
console.log('Loading function');

var AWS = require('aws-sdk');
var docClient = require('./dynamodb_document');
var collector = require('./instance_attr_collector');

exports.handler = (event, context, callback) => {

  console.log('Received event:', JSON.stringify(event, null, 2));
  /*
  { "version": "0",
    "id": "29288009-8275-4104-bf63-72d202c9c27f",
    "detail-type": "Scheduled Event",
    "source": "aws.events",
    "account": "089476987273",
    "time": "2016-08-25T18:44:05Z",
    "region": "us-east-1",
    "resources": [ "arn:aws:events:us-east-1:089476987273:rule/SpotinstBuilder-EventSchedule-VD5CIMG0MM3H" ],
    "detail": {} }
  */

  var main_region = event.region;
  var main_account = event.account;

  var fs = require("fs");
  var config = fs.readFileSync(__dirname + '/config/config.json', {encoding:'utf8'});
  var config_json = JSON.parse(config);
  console.log(config_json);
  var cpuUtilizationThreshold = config_json['cpuUtilizationThreshold'];
  var snsMessageSubject = config_json['snsMessageSubject'];
  var snsTopicArn = config_json['snsTopicArn'].replace("<region>", main_region).replace("<account>", main_account);
  var dynamodbTableName = config_json['dynamodbTableName'];

  // first, remove the old data from dynamodb
  var intervalHour = 1;
  docClient.removeOldItems(dynamodbTableName, intervalHour, main_region).then(function(ret) {
    console.log(ret);
    var regionInstances = {};
    var ec2Main = new AWS.EC2({region:main_region});
    return ec2Main.describeRegions({}).promise().then(function(data) {
      return Promise.all(data.Regions.map(function(region) {
        console.log("===============================================");
        console.log("Region : " + region.RegionName);
        return collector.getRunningEC2Instances(region.RegionName).then(function(instances) {
          //console.log(instances);
          return instances;
        }).then(function(instances) {
          var promises = [];
          for(var idx = 0; idx < instances.length; idx++) {
            promises.push(collector.getAWSCPUUtilizationMetricStatisticsByEC2Instance(instances[idx], region.RegionName));
          }
          return Promise.all(promises).then(function(instanceMetricsArray) {
            for (var idx = 0; idx < instances.length; idx++) {
              instances[idx].Metrics = instanceMetricsArray[idx];
            }
            regionInstances[region.RegionName] = instances;
          });
        });
      }));
    }).then(function() {
      console.log(regionInstances);
      return regionInstances;
    });
  }).then(function(regionInstances) {
    console.log(regionInstances);
    var promises = [];
    Object.keys(regionInstances).forEach(function(key) {
      regionInstances[key].forEach(function(instance) {
        if (instance.Metrics && instance.Metrics.Maximum < cpuUtilizationThreshold) {
          instance.Region = key;
          instance.Account = main_account;  // temporarily until all accounts are supported
          console.log("\n\n");
          console.log(JSON.stringify(instance, null, 2));
          promises.push(collector.sendSNSNotification(instance, snsMessageSubject, snsTopicArn, main_region));
        }
      });
    });
    console.log("***sending notification");
    Promise.all(promises).then(function(retArray) {
      console.log(retArray);
      callback(null, retArray);
    }).catch(function(err) {
      console.log(err);
      callback(err);
    });
  }).catch(function(err) {
    console.log(err);
    callback(err);
  });
}

function getRunningEC2InstancesInRegion(region) {
  return collector.getRunningEC2Instances(region).then(function(instances) {
    return instances;
  }).then(function(instances) {
    var promises = [];
    for(var idx = 0; idx < instances.length; idx++) {
      promises.push(collector.getAWSCPUUtilizationMetricStatisticsByEC2Instance(instances[idx], region));
    }
    return Promise.all(promises).then(function(instanceMetricsArray) {
      for (var idx = 0; idx < instances.length; idx++) {
        instances[idx].Metrics = instanceMetricsArray[idx];
      }
      return instances;
    });
  });
}
