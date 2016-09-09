
var inherits = require('util').inherits;
var FlowController = require('../flow_controller');
var AWS = require('aws-sdk');

function AWSLambda() {

  FlowController.call(this);

  var me = this;

  me.findService = function(input) {
    var params = {region:input.region};
    if (input.creds)  params.credentials = input.creds;
    else if (input.profile) {
      var credentials = new AWS.SharedIniFileCredentials({profile: input.profile});
      AWS.config.credentials = credentials;
    }
    var lambda = new AWS.Lambda(params);
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
    console.log(params);
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

  me.getPolicy = function(input, callback) {

    var params = {
      FunctionName: input.functionName, /* required */
    };
    var self = arguments.callee;

    if (callback) {
      var lambda = me.findService(input);
      lambda.getPolicy(params, callback);
      return;
    }

    var lambda = me.preRun(self, input);
    lambda.getPolicy(params, me.callbackFindOne);
  }

  me.addPermission = function(input, callback) {

    var principal = (input.principal) ? input.principal : "sns.amazonaws.com";
    var statementId = (input.statementId) ? input.statementId : "sns_invoke";
    var action = (input.action) ? input.action : "lambda:invokeFunction";
    var params = {
      Action: action, /* required */
      FunctionName: input.functionName, /* required */
      Principal: principal, /* required */
      StatementId: statementId, /* required */
      //SourceAccount: 'STRING_VALUE',
      //SourceArn: 'STRING_VALUE'
    };
    if (input.sourceAccount) {
      params['SourceAccount'] = input.sourceAccount;
    }
    if (input.sourceArn) {
      params['SourceArn'] = input.sourceArn;
    }
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
