
var inherits = require('util').inherits;
var FlowController = require('../flow_controller');
var AWS = require('aws-sdk');

function AWSTopic() {

  FlowController.call(this);

  var me = this;

  me.findService = function(input) {
    var params = {region:input.region};
    if (input.creds)  params.credentials = input.creds;
    else if (input.profile) {
      var credentials = new AWS.SharedIniFileCredentials({profile: input.profile});
      AWS.config.credentials = credentials;
    }
    var sqs = new AWS.SQS(params);
    return sqs;
  }

  me.createQueue = function(input, callback) {

    var params = {
      QueueName: input.queueName
    };
    var self = arguments.callee;

    if (callback) {
      var sqs = me.findService(input);
      sqs.createQueue(params, callback);
      return;
    }

    self.addParams = function(data) {
      self.params.queueUrl = data.QueueUrl;
    }

    var sqs = me.preRun(self, input);
    sqs.createQueue(params, me.callback);
  }

  me.purgeQueue = function(input, callback) {

    var params = {
      QueueUrl: input.queueUrl
    };
    var self = arguments.callee;

    if (callback) {
      var sqs = me.findService(input);
      sqs.purgeQueue(params, callback);
      return;
    }

    var sqs = me.preRun(self, input);
    sqs.purgeQueue(params, me.callback);
  }

  me.sendMessage = function(input, callback) {

    var params = {
      QueueUrl: input.queueUrl,
      MessageBody: input.messageBody,
      DelaySeconds: input.delaySeconds
    };
    var self = arguments.callee;

    if (callback) {
      var sqs = me.findService(input);
      sqs.sendMessage(params, callback);
      return;
    }

    var sqs = me.preRun(self, input);
    sqs.sendMessage(params, me.callback);
  }
}

module.exports = AWSTopic
