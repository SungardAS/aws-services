//chandra
exports.handler = function (event, context) {

  var aws_sts = new (require('../lib/aws/sts'))();
  var aws_config = new (require('../lib/aws/awsconfig.js'))();
  var aws_lambda = new (require('../lib/aws/lambda.js'))();
  var aws  = require("aws-sdk");

  if (!event.federateRoleName)  event.federateRoleName = "federate";

  var roles = [];
  if (event.federateAccount) {
    roles.push({roleArn:'arn:aws:iam::' + event.federateAccount + ':role/' + event.federateRoleName});
    var admin_role = {roleArn:'arn:aws:iam::' + event.account + ':role/' + event.roleName};
    if (event.roleExternalId) {
      admin_role.externalId = event.roleExternalId;
    }
    roles.push(admin_role);
  }
  console.log(roles);

  var sessionName = event.sessionName;
  if (sessionName == null || sessionName == "") {
    sessionName = "session";
  }

  function succeeded(input) { context.done(null, true); }
  function failed(input) { context.done(null, false); }
  function errored(err) { context.fail(err, null); }

    var input = {
       sessionName: sessionName,
       roles: roles,
       region: event.region,
       ruleName: event.ruleName,
       owner: event.owner,
       sourceID: event.sourceID,
       resorceType: event.resorceType,
       descript: event.description,
       params: event.params,
       messageType: event.messageType,
       functionName: event.functionName,
       principal: "config.amazonaws.com",
       sourceAccount: event.customerAccount,
       customerRegion: event.customerRegion,
       statementId: event.statementId, //unique string, some uuid from api
       action: event.action
    };
    var flows = [
       {func:aws_lambda.addPermission, success:aws_sts.assumeRoles, failure:failed, error:errored},
       {func:aws_sts.assumeRoles, success:aws_config.enableRule, failure:failed, error:errored},
       {func:aws_config.enableRule, success:succeeded, failure:failed, error:errored},
    ];
    aws_sts.flows = flows;
    aws_config.flows = flows;
    aws_lambda.flows = flows;

    flows[0].func(input);
};
