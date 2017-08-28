exports.handler = function (event, context) {

  //var aws_sts = new (require('../lib/aws/sts'))();
  var aws_config = new (require('../lib/aws/awsconfig.js'))();
  var aws  = require("aws-sdk");

  //if (!event.federateRoleName)  event.federateRoleName = "federate";

  //var roles = [];
  //if (event.federateAccount) {
  //  roles.push({roleArn:'arn:aws:iam::' + event.federateAccount + ':role/' + event.federateRoleName});
  //  var admin_role = {roleArn:'arn:aws:iam::' + event.account + ':role/' + event.roleName};
  //  if (event.roleExternalId) {
  //    admin_role.externalId = event.roleExternalId;
  //  }
  //  roles.push(admin_role);
  //}
  //console.log(roles);

  var sessionName = event.sessionName;
  if (sessionName == null || sessionName == "") {
    sessionName = "session";
  }
  function succeeded(input) { context.done(null, input.rules);}
  function failed(input) { context.done(null, false); }
  function errored(err) { context.fail(err, null); }
  console.log(event)
  var creds = new aws.Credentials({
      accessKeyId: event.creds.AccessKeyId,
      secretAccessKey: event.creds.SecretAccessKey,
      sessionToken: event.creds.SessionToken
  });

    var input = {
       sessionName: sessionName,
       //roles: roles,
       region: event.region,
       creds:creds
    };
    var flows = [
       //{func:aws_sts.assumeRoles, success:aws_config.getCreatedRules, failure:failed, error:errored},
       {func:aws_config.getCreatedRules, success:succeeded, failure:failed, error:errored},
    ];
    //aws_sts.flows = flows;
    aws_config.flows = flows;

    flows[0].func(input);
};
