
function AWSCloudTrail() {

  var AWS = require('aws-sdk');

  var FC = require('./function_chain');
  var fc = new FC();

  var me = this;

  me.findTrails = function(input) {
    if (input.profile) {
      var credentials = new AWS.SharedIniFileCredentials({profile: input.profile});
      AWS.config.credentials = credentials;
    }
    trailService = new AWS.CloudTrail({'region':input.region});
    params = {}
    //if (input.trailNameList) params.trailNameList = input.trailNameList;
    trailService.describeTrails(params, function (err, data) {
      if (err) {
        console.log("Error in findTrails : " + err, err.stack);
        fc.run_error_function(me.findTrails, err);
      }
      else {
        console.log(data);
        if (data.trailList[0]) {
          console.log("found a trail");
          input.trailName = data.trailList[0].Name;
          fc.run_success_function(me.findTrails, input);
        }
        else {
          console.log("trail(s) not found");
          fc.run_failure_function(me.findTrails, input);
        }
      }
    });
  }

  me.isLogging = function(input) {
    if (input.profile) {
      var credentials = new AWS.SharedIniFileCredentials({profile: input.profile});
      AWS.config.credentials = credentials;
    }
    trailService = new AWS.CloudTrail({'region':input.region});
    params = {Name:input.trailName};
    trailService.getTrailStatus(params, function (err, data) {
      if (err) {
        console.log("Error in getTrailStatus : " + err, err.stack);
        fc.run_error_function(me.isLogging, err);
      }
      else {
        console.log(data);
        if (data.IsLogging === true) {
          console.log('logging is currently on');
          fc.run_success_function(me.isLogging, input);
        }
        else {
          console.log('logging is currently off');
          fc.run_failure_function(me.isLogging, input);
        }
      }
    });
  }

  me.createTrail = function(input) {
    if (input.profile) {
      var credentials = new AWS.SharedIniFileCredentials({profile: input.profile});
      AWS.config.credentials = credentials;
    }
    trailService = new AWS.CloudTrail({'region':input.region});
    params = {Name: input.trailName, S3BucketName: input.bucketName};
    if (input.CloudWatchLogsLogGroupArn) params.CloudWatchLogsLogGroupArn = input.params.CloudWatchLogsLogGroupArn;
    if (input.CloudWatchLogsRoleArn) params.CloudWatchLogsRoleArn = input.params.CloudWatchLogsRoleArn;
    if (input.IncludeGlobalServiceinputs)  params.IncludeGlobalServiceinputs = input.params.IncludeGlobalServiceinputs;
    if (input.S3KeyPrefix) params.S3KeyPrefix = input.params.S3KeyPrefix;
    if (input.SnsTopicName)  params.SnsTopicName = input.params.SnsTopicName;
    trailService.createTrail(params, function (err, data) {
      if (err) {
        console.log("Error in createTrail : " + err, err.stack);
        fc.run_error_function(me.createTrail, err);
      }
      else {
        console.log('trail is successfully created');
        console.log(data);
        fc.run_success_function(me.createTrail, input);
      }
    });
  }

  me.deleteTrail = function(input) {
    if (input.profile) {
      var credentials = new AWS.SharedIniFileCredentials({profile: input.profile});
      AWS.config.credentials = credentials;
    }
    trailService = new AWS.CloudTrail({'region':input.region});
    params = {Name: input.trailName};
    trailService.deleteTrail(params, function (err, data) {
      if (err) {
        console.log("Error in deleteTrail : " + err, err.stack);
        fc.run_error_function(me.deleteTrail, err);
      }
      else {
        console.log('trail is successfully deleted');
        console.log(data);
        fc.run_success_function(me.deleteTrail, input);
      }
    });
  }

  me.startLogging = function(input) {
    if (input.profile) {
      var credentials = new AWS.SharedIniFileCredentials({profile: input.profile});
      AWS.config.credentials = credentials;
    }
    trailService = new AWS.CloudTrail({'region':input.region});
    params = {Name:input.trailName};
    trailService.startLogging(params, function (err, data) {
      if (err) {
        console.log("Error in startLogging : " + err, err.stack);
        fc.run_error_function(me.startLogging, err);
      }
      else {
        console.log(data);
        console.log('logging is successfully started');
        fc.run_success_function(me.startLogging, input);
      }
    });
  }

  me.stopLogging = function(input) {
    if (input.profile) {
      var credentials = new AWS.SharedIniFileCredentials({profile: input.profile});
      AWS.config.credentials = credentials;
    }
    trailService = new AWS.CloudTrail({'region':input.region});
    params = {
      Name: input.trailName
    };
    trailService.stopLogging(params, function(err, data) {
      if (err) {
        console.log("Error in stopLogging : " + err, err.stack);
        fc.run_error_function(me.stopLogging, err);
      }
      else {
        console.log(data);
        console.log('logging is successfully stopped');
        fc.run_success_function(me.stopLogging, input);
      }
    });
  }
}

module.exports = AWSCloudTrail
