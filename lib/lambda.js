
function AWSLambda() {

  var AWS = require('aws-sdk');

  var FC = require('./function_chain');
  var fc = new FC();

  var me = this;

  me.findService = function(input) {
    if (input.profile) {
      var credentials = new AWS.SharedIniFileCredentials({profile: input.profile});
      AWS.config.credentials = credentials;
    }
    var lambda = new AWS.Lambda({region:input.region});
    return lambda;
  }

  me.findFunction = function(input) {
    var lambda = me.findService(input);
    var params = {
      FunctionName: input.functionName /* required */
    };
    lambda.getFunction(params, function(err, data) {
      if (err) {
        // console.log("Error in getFunction : " + err, err.stack);
        console.log("a function not found");
        fc.run_failure_function(me.findFunction, input);
    }
      else {
        console.log("found a function");
        console.log(data);
        input.functionArn = data.Configuration.FunctionArn;
        fc.run_success_function(me.findFunction, input);
      }
    });
  }

  me.createFunction = function(input) {
    var lambda = me.findService(input);
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
    lambda.createFunction(params, function(err, data) {
      if (err) {
        console.log("Error in createFunction : " + err, err.stack);
        fc.run_error_function(me.createFunction, err);
      }
      else {
        console.log(data);
        console.log("successfully created a function : " + data.FunctionArn);
        input.functionArn = data.FunctionArn;
        fc.run_success_function(me.createFunction, input);
      }
    });
  }

  me.updateFunctionCode = function(input) {
    var lambda = me.findService(input);
    var params = {
      FunctionName: input.functionName, /* required */
      S3Bucket: input.bucketName,
      S3Key: input.keyName,
      //S3ObjectVersion: 'STRING_VALUE',
      //ZipFile: new Buffer('...') || 'STRING_VALUE'
    };
    lambda.updateFunctionCode(params, function(err, data) {
      if (err) {
        console.log("Error in updateFunctionCode : " + err, err.stack);
        fc.run_error_function(me.updateFunctionCode, err);
      }
      else {
        console.log(data);
        console.log("successfully updated a function");
        fc.run_success_function(me.updateFunctionCode, input);
      }
    });
  }

  me.deleteFunction = function(input) {
    var lambda = me.findService(input);
    var params = {
      FunctionName: input.functionName /* required */
    };
    lambda.deleteFunction(params, function(err, data) {
      if (err) {
        console.log("Error in deleteFunction : " + err, err.stack);
        fc.run_error_function(me.deleteFunction, err);
      }
      else {
        console.log(data);
        console.log("successfully deleted a function");
        fc.run_success_function(me.deleteFunction, input);
      }
    });
  }

  me.addPermission = function(input) {
    var lambda = me.findService(input);
    var params = {
      Action: "lambda:invokeFunction", /* required */
      FunctionName: input.functionName, /* required */
      Principal: "sns.amazonaws.com", /* required */
      StatementId: 'sns_invoke', /* required */
      //SourceAccount: 'STRING_VALUE',
      //SourceArn: 'STRING_VALUE'
    };
    lambda.addPermission(params, function(err, data) {
      if (err) {
        console.log("Error in addPermission : " + err, err.stack);
        fc.run_error_function(me.addPermission, err);
      }
      else {
        console.log(data);
        console.log("successfully added a permission");
        fc.run_success_function(me.addPermission, input);
      }
    });
  }
}

module.exports = AWSLambda
