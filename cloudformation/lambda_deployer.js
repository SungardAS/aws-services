
var AWS = require('aws-sdk');

function LambdaFunctionDeployer() {

  var me = this;

  me.deploy = function(input, callback) {

    var params = {region: input.region};
    if (input.creds)  params.credentials = input.creds;
    var lambda = new AWS.Lambda(params);

    params = {
      FunctionName: input.functionName
    };
    console.log(params);
    lambda.getFunction(params, function(err, data) {
      if (err) {
        params = {
          Code: {
            S3Bucket: input.bucketName,
            S3Key: input.keyName,
          },
          FunctionName: input.functionName,
          Handler: input.handler,
          Role: input.roleArn,
          Runtime: 'nodejs',
          Description: '',
          MemorySize: input.memorySize,
          Timeout: input.timeout
        };
        console.log(params);
        lambda.createFunction(params, function(err, data) {
          if (err) {
            callback(err, null);
          }
          else {
            callback(null, data.FunctionArn);
          }
        });
      }
      else {
        var functionArn = data.Configuration.FunctionArn;
        var params = {
          FunctionName: input.functionName,
          S3Bucket: input.bucketName,
          S3Key: input.keyName,
        };
        console.log(params);
        lambda.updateFunctionCode(params, function(err, data) {
          if (err) {
            callback(err, null);
          }
          else {
            callback(null, functionArn);
          }
        });
      }
    });
  }

  me.clean = function(input, callback) {

    var params = {region: input.region};
    if (input.creds)  params.credentials = input.creds;
    var lambda = new AWS.Lambda(params);

    params = {
      FunctionName: input.functionName
    };
    console.log(params);
    lambda.getFunction(params, function(err, data) {
      if (err) {
        callback(null, true);
      }
      else {
        lambda.deleteFunction(params, function(err, data) {
          if (err) {
            callback(err, null);
          }
          else {
            callback(null, true);
          }
        });
      }
    });
  }

  me.build = function(action, packageJSON, callback) {
    var input = {
      region: packageJSON.Region,
      functionName: packageJSON.FunctionName,
      bucketName: packageJSON.Code.S3Bucket,
      keyName: packageJSON.Code.S3Key,
      handler: packageJSON.Handler,
      roleArn: packageJSON.Role,
      memorySize: packageJSON.MemorySize,
      timeout: packageJSON.Timeout
    };
    console.log(input);
    me[action](input, callback);
  }
}

module.exports = LambdaFunctionDeployer
