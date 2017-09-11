exports.handler = function (event, context) {

  var aws_config = new (require('../lib/aws/awsconfig.js'))();
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
  var input = {
      sessionName: sessionName,
      region: event.region,
      ruleName: event.ruleName,
      creds:creds
  };

  var flows = [
      {func:aws_config.deleteRules, success:succeeded, failure:failed, error:errored},
  ];

  aws_config.flows = flows;

  flows[0].func(input);
};
