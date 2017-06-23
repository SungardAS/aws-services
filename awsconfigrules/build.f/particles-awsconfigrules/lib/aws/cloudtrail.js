
var inherits = require('util').inherits;
var AWSFlowController = require('../flow_controller');
var AWS = require('aws-sdk');

function AWSCloudTrail() {

  AWSFlowController.call(this);

  var me = this;

  me.findService = function(input) {
    var params = {region:input.region};
    if (input.creds)  params.credentials = input.creds;
    else if (input.profile) {
      var credentials = new AWS.SharedIniFileCredentials({profile: input.profile});
      AWS.config.credentials = credentials;
    }
    trailService = new AWS.CloudTrail(params);
    return trailService;
  }

  me.findTrails = function(input, callback) {

    params = {}
    if (input.trailName) params.trailNameList = [ input.trailName ];
    var self = arguments.callee;

    if (callback) {
      var trailService = me.findService(input);
      trailService.describeTrails(params, callback);
      return;
    }

    self.callbackFind = function(data) {
      if (data.trailList[0]) {
        console.log("found a trail");
        return data.trailList[0];
      }
      else {
        console.log("trail(s) not found");
        return null;
      }
    }

    self.addParams = function(found) {
      self.params.trailName = found.Name;
    }

    var trailService = me.preRun(self, input);
    trailService.describeTrails(params, me.callbackFind);
  }

  me.isLogging = function(input, callback) {

    params = {Name:input.trailName};
    var self = arguments.callee;

    if (callback) {
      var trailService = me.findService(input);
      trailService.getTrailStatus(params, callback);
      return;
    }

    self.callbackBoolean = function(data) {
      return data.IsLogging === true;
    }

    var trailService = me.preRun(self, input);
    trailService.getTrailStatus(params, me.callbackBoolean);
  }

  me.createTrail = function(input, callback) {

    params = {Name: input.trailName, S3BucketName: input.bucketName};
    if (input.CloudWatchLogsLogGroupArn) params.CloudWatchLogsLogGroupArn = input.params.CloudWatchLogsLogGroupArn;
    if (input.CloudWatchLogsRoleArn) params.CloudWatchLogsRoleArn = input.params.CloudWatchLogsRoleArn;
    if (input.IncludeGlobalServiceinputs)  params.IncludeGlobalServiceinputs = input.params.IncludeGlobalServiceinputs;
    if (input.S3KeyPrefix) params.S3KeyPrefix = input.params.S3KeyPrefix;
    if (input.SnsTopicName)  params.SnsTopicName = input.params.SnsTopicName;
    if (input.multiRegion)  params.IsMultiRegionTrail = input.multiRegion;
    var self = arguments.callee;

    if (callback) {
      var trailService = me.findService(input);
      trailService.createTrail(params, callback);
      return;
    }

    var trailService = me.preRun(self, input);
    trailService.createTrail(params, me.callback);
  }

  me.deleteTrail = function(input, callback) {

    params = {Name: input.trailName};
    var self = arguments.callee;

    if (callback) {
      var trailService = me.findService(input);
      trailService.deleteTrail(params, callback);
      return;
    }

    var trailService = me.preRun(self, input);
    trailService.deleteTrail(params, me.callback);
  }

  me.startLogging = function(input, callback) {

    params = {Name:input.trailName};
    var self = arguments.callee;

    if (callback) {
      var trailService = me.findService(input);
      trailService.startLogging(params, callback);
      return;
    }

    var trailService = me.preRun(self, input);
    trailService.startLogging(params, me.callback);
  }

  me.stopLogging = function(input, callback) {

    params = {
      Name: input.trailName
    };
    var self = arguments.callee;

    if (callback) {
      var trailService = me.findService(input);
      trailService.stopLogging(params, callback);
      return;
    }

    var trailService = me.preRun(self, input);
    trailService.stopLogging(params, me.callback);
  }
}

module.exports = AWSCloudTrail
