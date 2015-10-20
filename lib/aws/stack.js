
var sleep = require('sleep');
var inherits = require('util').inherits;
var FlowController = require('../flow_controller');
var AWS = require('aws-sdk');

function AWSCloudformation() {

  FlowController.call(this);

  var me = this;

  me.findService = function(input) {
    var params = {region:input.region};
    if (input.creds)  params.credentials = input.creds;
    else if (input.profile) {
      var credentials = new AWS.SharedIniFileCredentials({profile: input.profile});
      AWS.config.credentials = credentials;
    }
    var cloudformation = new AWS.CloudFormation(params);
    return cloudformation;
  }

  me.findStack = function(input, callback) {

    var params = {
      StackName: input.stackName
    };
    console.log(params);
    var self = arguments.callee;

    if (callback) {
      var cloudformation = me.findService(input);
      cloudformation.describeStacks(params, callback);
      return;
    }

    self.addParams = function(data) {
      self.params.stack = data.Stacks[0];
    }

    var cloudformation = me.preRun(self, input);
    cloudformation.describeStacks(params, me.callbackFindOne);
  }

  me.createStack = function(input, callback) {

    var params = {
      StackName: input.stackName,
      Capabilities: ['CAPABILITY_IAM'],
      TemplateBody: input.templateStr
    };
    if (input.parameters) params.Parameters = input.parameters;

    console.log(params);
    var self = arguments.callee;

    if (callback) {
      var cloudformation = me.findService(input);
      cloudformation.createStack(params, callback);
      return;
    }

    self.addParams = function(data) {
      self.params.stackId = data.StackId;
    }

    var cloudformation = me.preRun(self, input);
    cloudformation.createStack(params, me.callback);
  }

  me.deleteStack = function(input, callback) {

    var params = {
      StackName: input.stackName
    };
    console.log(params);
    var self = arguments.callee;

    if (callback) {
      var cloudformation = me.findService(input);
      cloudformation.deleteStack(params, callback);
      return;
    }

    var cloudformation = me.preRun(self, input);
    cloudformation.deleteStack(params, me.callback);
  }

  me.waitForComplete = function(input, callback) {

    var params = {
      StackName: input.stackName
    };
    console.log(params);
    var self = arguments.callee;

    if (callback) {
      var cloudformation = me.findService(input);
      checkStackStatus(input, cloudformation, params, callback);
      return;
    }

    var cloudformation = me.preRun(self, input);
    checkStackStatus(input, cloudformation, params, me.callbackFindOne);
  }

  function checkStackStatus(input, cloudformation, params, callback) {
    cloudformation.describeStacks(params, function(err, data) {
      if (err) {
        callback(err);
      }
      else {
        console.log(data);
        if (data.Stacks[0]) {
          var status = data.Stacks[0].StackStatus;
          if (status.indexOf('_IN_PROGRESS') > 0) {
            sleep.sleep(5); //sleep for 5 seconds
            checkStackStatus(input, cloudformation, params, callback);
          }
          else {
            input.status = status;
            callback(null, input);
          }
        }
        else {
          callback("Failed to find stack status");
        }
      }
    });
  }
}

module.exports = AWSCloudformation
