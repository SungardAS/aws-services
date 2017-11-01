exports.handler = function (event, context) {

  var aws_config = new (require('../lib/aws/awsconfig.js'))();
  var aws  = require("aws-sdk");

  var sessionName = event.sessionName;
  if (sessionName == null || sessionName == "") {
    sessionName = "session";
  }
  function succeeded(input) { context.done(null, input.rules);console.log(input.rules)}
  function failed(input) { context.done(null, false); }
  function errored(err) { context.fail(err, null); }

  var creds = new aws.Credentials({
      accessKeyId: event.creds.AccessKeyId,
      secretAccessKey: event.creds.SecretAccessKey,
      sessionToken: event.creds.SessionToken
  });

    var input = {
       sessionName: sessionName,
       region: event.region,
       creds:creds
    };
    console.log(input)
    var flows = [
       {func:aws_config.getCreatedRules, success:succeeded, failure:failed, error:errored},
    ];
    aws_config.flows = flows;

    flows[0].func(input);
};
