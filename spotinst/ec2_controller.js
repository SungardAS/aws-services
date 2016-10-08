
var AWS = require('aws-sdk');
var sts = require('./lib/sts');

var trustedAdvisorCheckInput = {
  checkId: 'Qch7DwouX1',
  language: 'en'
};

module.exports = {

  post: function(params) {

    var federateRoleArn = params.federateRoleArn;
    var accountRoleArn = params.accountRoleArn;
    var externalId = params.externalId;
    var main_region = params.region;

    var support = null;
    var autoscaling = null;

    var instanceDict = {};
    var regionDict = {};
    var credentials = null;

    return sts.assumeRole(federateRoleArn, accountRoleArn, externalId).then(function(creds) {
      credentials = creds;
      support = new AWS.Support({credentials: creds, region: main_region});
      autoscaling = new AWS.AutoScaling({credentials: creds, region: main_region});
    }).then(function() {
      var params = trustedAdvisorCheckInput;
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
      });
    }).then(function(instanceIds) {
      if (!instanceIds || instanceIds.length == 0) {
        return new Promise(function(resolve, reject) {
          resolve([]);
        });
      }
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
      });
    }).then(function(instanceIds) {
      if (instanceIds.length == 0) {
        return new Promise(function(resolve, reject) {
          resolve([]);
        });
      }
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
      });
    }).then(function(austoScalingGroupNames) {
      if (austoScalingGroupNames.length == 0) {
        return new Promise(function(resolve, reject) {
          resolve({});
        });
      }
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
      });
    }).then(function(autoScalingGroupDict) {
      var instances = [];
      Object.keys(instanceDict).forEach(function(key) {
        instanceDict[key].autoScalingGroup = autoScalingGroupDict[instanceDict[key].autoScalingGroupName];
        instances.push(instanceDict[key]);
      });
      console.log("############");
      console.log(JSON.stringify(instances, null, 2));
      return instances;
    });
  }
}
