exports.handler = function (event, context) {

  var aws_config = new (require('../lib/aws/awsconfig.js'))();
  var aws_lambda = new (require('../lib/aws/lambda.js'))();
  var aws  = require("aws-sdk");

  var creds = new aws.Credentials({
    accessKeyId: event.creds.AccessKeyId,
    secretAccessKey: event.creds.SecretAccessKey,
    sessionToken: event.creds.SessionToken
  });

  var sessionName = event.sessionName;
  if (sessionName == null || sessionName == "") {
    sessionName = "session";
  }

  function succeeded(input) { context.done(null, true); }
  function failed(input) { context.done(null, false); }
  function errored(err) { context.fail(err, null); }

    console.log(event);
    if (event.owner == "CUSTOM_LAMBDA"){
      var input = {
         sessionName: sessionName,
         region: event.region,
         ruleName: event.ruleName,
         owner: event.owner,
         sourceID: event.sourceID,
         resourceType: event.resourceType,
         descript: event.description,
         params: JSON.stringify(event.params),
         messageType: event.messageType,
         functionName: event.functionName,
         principal: event.principal,
         sourceAccount: event.customerAccount,
         statementId: event.statementId, //unique string, some uuid from api
         action: event.action,
         custAccount:creds
      };
        var flows = [
            {func:aws_lambda.addPermission, success:aws_config.enableRule, failure:failed, error:errored},
            {func:aws_config.enableRule, success:succeeded, failure:failed, error:errored}
        ];
      aws_lambda.flows = flows;
    }else{
      var input = {
         sessionName: sessionName,
         region: event.region,
         ruleName: event.ruleName,
         owner: event.owner,
         sourceID: event.sourceID,
         resourceType: event.resourceType,
         descript: event.description,
         params: JSON.stringify(event.params),
         creds:creds
      };
        var flows = [
            {func:aws_config.enableRule, success:succeeded, failure:failed, error:errored},
        ];
    }

    aws_config.flows = flows;
    flows[0].func(input);
};
