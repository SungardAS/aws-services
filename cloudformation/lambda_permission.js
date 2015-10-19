
var AWS = require('aws-sdk');

function LambdaFunctionPermission() {

  var me = this;

  me.deploy = function(input, callback) {
    me.getPolicy(input, callback);
  }

  me.getPolicy = function(input, callback) {
    var params = {region: input.region};
    if (input.creds)  params.credentials = input.creds;
    var lambda = new AWS.Lambda(params);
    params = {
      FunctionName: input.functionName
    };
    console.log('getPolicy : ' + JSON.stringify(params));
    lambda.getPolicy(params, function(err, data) {
      if (err) {
        me.addPermission(input, callback);
      }
      else {
        callback(null, true);
      }
    });
  }

  me.addPermission = function(input, callback) {
    var params = {region: input.region};
    if (input.creds)  params.credentials = input.creds;
    var lambda = new AWS.Lambda(params);
    params = {
      Action: input.action,
      FunctionName: input.functionName,
      Principal: input.principal,
      StatementId: input.statementId
    };
    console.log('addPermission : ' + JSON.stringify(params));
    lambda.addPermission(params, callback);
  }

  me.clean = function(input, callback) {
    callback(null, true);
  }

  me.build = function(action, packageJSON, callback) {
    var input = {
      region: packageJSON.region,
      action: packageJSON.action,
      principal: packageJSON.principal,
      statementId: packageJSON.statementId,
      functionName: packageJSON.functionName,
      creds: packageJSON.creds
    };
    console.log(input);
    me[action](input, callback);
  }
}

module.exports = LambdaFunctionPermission
