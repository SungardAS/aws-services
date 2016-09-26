'use strict';
console.log('Loading function');

var AWS = require('aws-sdk');

exports.handler = (event, context, callback) => {

  console.log('Received event:', JSON.stringify(event, null, 2));

  var federateRoleArn = event.federateRoleArn;
  var accountRoleArn = event.accountRoleArn;
  var externalId = event.externalId;

  var main_region = event.region;
  var support = null;
  var autoscaling = null;

  var instanceDict = {};
  var regionDict = {};
  var credentials = null;

  assumeRole(federateRoleArn, accountRoleArn, externalId).then(function(creds) {
    credentials = creds;
    support = new AWS.Support({credentials: creds, region: main_region});
    autoscaling = new AWS.AutoScaling({credentials: creds, region: main_region});
  }).then(function() {
    var params = {
      checkId: 'Qch7DwouX1',
      language: 'en'
    };
    return support.describeTrustedAdvisorCheckResult(params).promise().then(function(data) {
      console.log(JSON.stringify(data, null, 2));
      var instanceIds = [];
      data.result.flaggedResources.forEach(function(resource) {
        instanceIds.push(resource.metadata[1]);
        instanceDict[resource.metadata[1]] = resource;
        if (regionDict[resource.region]) {
          regionDict[resource.region].push(resource.metadata[1]);
        }
        else {
          regionDict[resource.region] = [resource.metadata[1]];
        }
      });
      console.log(regionDict);
      return instanceIds;
    }).catch(function(err) {
      console.log(err);
      callback(err);
    });
  }).then(function(instanceIds) {
    // find ec2 instance details for each region
    var promises = [];
    Object.keys(regionDict).forEach(function(region) {
      var ec2 = new AWS.EC2({credentials: credentials, region: region});
      promises.push(ec2.describeInstances({InstanceIds: regionDict[region]}).promise());
    });
    return Promise.all(promises).then(function(reservationsArray) {
      console.log(reservationsArray);
      reservationsArray.forEach(function(reservations) {
        reservations.Reservations.forEach(function(reservation) {
          reservation.Instances.forEach(function(ec2) {
            instanceDict[ec2.InstanceId].detail = ec2;
          });
        });
      });
      console.log(instanceDict);
      return instanceIds;
    }).catch(function(err) {
      console.log(err);
      callback(err);
    });
  }).then(function(instanceIds) {
    var params = {
      InstanceIds: instanceIds,
      //MaxRecords: 0,
      //NextToken: 'STRING_VALUE'
    };
    return autoscaling.describeAutoScalingInstances(params).promise().then(function(data) {
      console.log(JSON.stringify(data, null, 2));
      var austoScalingGroupNames = [];
      data.AutoScalingInstances.forEach(function(instance) {
        austoScalingGroupNames.push(instance.AutoScalingGroupName);
        instanceDict[instance.InstanceId].autoScalingGroupName = instance.AutoScalingGroupName;
      });
      return austoScalingGroupNames;
    }).catch(function(err) {
      console.log(err);
      callback(err);
    });
  }).then(function(austoScalingGroupNames) {
    var params = {
      AutoScalingGroupNames: austoScalingGroupNames,
      //MaxRecords: 0,
      //NextToken: 'STRING_VALUE'
    };
    return autoscaling.describeAutoScalingGroups(params).promise().then(function(data) {
      console.log(JSON.stringify(data, null, 2));
      var autoScalingGroupDict = {};
      data.AutoScalingGroups.forEach(function(group) {
        autoScalingGroupDict[group.AutoScalingGroupName] = group;
      });
      return autoScalingGroupDict;
    }).catch(function(err) {
      console.log(err);
      callback(err);
    });
  }).then(function(autoScalingGroupDict) {
    var instances = [];
    Object.keys(instanceDict).forEach(function(key) {
      instanceDict[key].autoScalingGroup = autoScalingGroupDict[instanceDict[key].autoScalingGroupName];
      instances.push(instanceDict[key]);
    });
    return instances;
  }).then(function(instances) {
    //console.log(JSON.stringify(instanceDict, null, 2));
    console.log("############");
    console.log(JSON.stringify(instances, null, 2));
    callback(null, instances);
  }).catch(function(err) {
    console.log(err);
    callback(err);
  });
}

function assumeRole(federateRoleArn, accountRoleArn, externalId) {
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


//var ec2 = new AWS.EC2({region: 'us-west-2'});
//ec2.describeInstances({InstanceIds: ['i-07f32fba34ca2fb66']}).promise().then(function(data) { console.log(JSON.stringify(data, null, 2))}).catch(function(err) { console.log(err);});
/*{
  "Reservations": [
    {
      "ReservationId": "r-08793376dbe84994e",
      "OwnerId": "546276914724",
      "RequesterId": "AIDAIRZARCNRZMGWWWLII",
      "Groups": [],
      "Instances": [
        {
          "InstanceId": "i-07f32fba34ca2fb66",
          "ImageId": "ami-4f50a72f",
          ......
          "SpotInstanceRequestId": "sir-03ckmek0",
          "ClientToken": "f95ad2d2-9395-4794-8f5a-db86e2941553",
*/
