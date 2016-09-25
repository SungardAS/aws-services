
var AWS = require('aws-sdk');

function AWSLambda() {

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

  me.findAccountPolicy = function(input) {
    var lambda = me.findService(input);
    var params = {
      FunctionName: input.functionName,
    };
    return lambda.getPolicy(params).promise().then(data => {
      // { Policy: '{"Version":"2012-10-17","Statement":[{"Action":"lambda:InvokeFunction","Resource":"arn:aws:lambda:us-east-1:089476987273:function:SSOProxyElastigroup-SpotinstLambdaFunction-15P3UDNPADGF4","Effect":"Allow","Principal":{"AWS":"arn:aws:iam::290093585298:root"},"Sid":"Id-133"}],"Id":"default"}' }
      var lambdaArn = "arn:aws:lambda:us-east-1:089476987273:function:" + input.functionName
      var policy = JSON.parse(data.Policy)
      return policy.Statement.filter(statement =>
        statement.Action == 'lambda:InvokeFunction'
        && statement.Resource == lambdaArn
        && statement.Effect == 'Allow'
        && statement.Principal.AWS == 'arn:aws:iam::' + input.account + ':root').length > 0;
    });
  }

  me.addPermission = function(input) {
    var lambda = me.findService(input);
    var principal = (input.principal) ? input.principal : "sns.amazonaws.com";
    var statementId = (input.statementId) ? input.statementId : "sns_invoke";
    var params = {
      Action: "lambda:invokeFunction",
      FunctionName: input.functionName,
      Principal: principal,
      StatementId: statementId,
    };
    if (input.sourceAccount) {
      params['SourceAccount'] = input.sourceAccount;
    }
    if (input.sourceArn) {
      params['SourceArn'] = input.sourceArn;
    }
    lambda.addPermission(params).promise();
  }
}

module.exports = AWSLambda
