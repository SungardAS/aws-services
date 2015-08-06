
var inherits = require('util').inherits;
var FlowController = require('./flow_controller');
var AWS = require('aws-sdk');

function AWSLambda() {

  FlowController.call(this);

  var me = this;

  me.findService = function(input) {
    if (input.profile) {
      var credentials = new AWS.SharedIniFileCredentials({profile: input.profile});
      AWS.config.credentials = credentials;
    }
    var lambda = new AWS.Lambda({region:input.region});
    return lambda;
  }

  me.findFunction = function(input, callback) {

    var params = {
      FunctionName: input.functionName /* required */
    };
    var self = arguments.callee;

    if (callback) {
      var lambda = me.findService(input);
      lambda.getFunction(params, callback);
      return;
    }

    self.addParams = function(data) {
      self.params.functionArn = data.Configuration.FunctionArn;
    }

    var lambda = me.preRun(self, input);
    lambda.getFunction(params, me.callbackFindOne);
  }

  me.createFunction = function(input, callback) {

    var params = {
      Code: {
        S3Bucket: input.bucketName,
        S3Key: input.keyName,
        //S3ObjectVersion: 'STRING_VALUE',
      },
      FunctionName: input.functionName, /* required */
      Handler: input.handler, /* required */
      Role: input.roleArn, /* required */
      Runtime: 'nodejs', /* required */
      Description: '',
      MemorySize: input.memorySize,
      Timeout: input.timeout
    };
    console.log(params);
    var self = arguments.callee;

    if (callback) {
      var lambda = me.findService(input);
      lambda.createFunction(params, callback);
      return;
    }

    self.addParams = function(data) {
      self.params.functionArn = data.FunctionArn;
    }

    var lambda = me.preRun(self, input);
    lambda.createFunction(params, me.callback);
  }

  me.updateFunctionCode = function(input, callback) {

    var params = {
      FunctionName: input.functionName, /* required */
      S3Bucket: input.bucketName,
      S3Key: input.keyName,
      //S3ObjectVersion: 'STRING_VALUE',
      //ZipFile: new Buffer('...') || 'STRING_VALUE'
    };
    var self = arguments.callee;

    if (callback) {
      var lambda = me.findService(input);
      lambda.updateFunctionCode(params, callback);
      return;
    }

    var lambda = me.preRun(self, input);
    lambda.updateFunctionCode(params, me.callback);
  }

  me.deleteFunction = function(input, callback) {

    var params = {
      FunctionName: input.functionName /* required */
    };
    var self = arguments.callee;

    if (callback) {
      var lambda = me.findService(input);
      lambda.deleteFunction(params, callback);
      return;
    }

    var lambda = me.preRun(self, input);
    lambda.deleteFunction(params, me.callback);
  }

  me.addPermission = function(input, callback) {

    var params = {
      Action: "lambda:invokeFunction", /* required */
      FunctionName: input.functionName, /* required */
      Principal: "sns.amazonaws.com", /* required */
      StatementId: 'sns_invoke', /* required */
      //SourceAccount: 'STRING_VALUE',
      //SourceArn: 'STRING_VALUE'
    };
    var self = arguments.callee;

    if (callback) {
      var lambda = me.findService(input);
      lambda.addPermission(params, callback);
      return;
    }

    var lambda = me.preRun(self, input);
    lambda.addPermission(params, me.callback);
  }
}

module.exports = AWSLambda
