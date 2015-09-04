
exports.handler = function (event, context) {

  var aws_sts = new (require('../lib/aws/sts'))();
  var aws_trail = new (require('../lib/aws/cloudtrail'))();

  var roles = [];
  if (event.profile) {
    roles.push({roleArn:'arn:aws:iam::' + event.federateAccount + ':role/cto_across_accounts'});
  }
  roles.push({roleArn:'arn:aws:iam::' + event.federateAccount + ':role/federate'});
  var admin_role = {roleArn:'arn:aws:iam::' + event.account + ':role/' + event.roleName};
  if (event.roleExternalId) {
    admin_role.externalId = event.roleExternalId;
  }
  roles.push(admin_role);
  console.log(roles);

  var input = {
    profile: (event.profile === undefined) ? null : event.profile,
    sessionName: event.sessionName,
    roles: roles,
    region: event.region
  };

  function succeeded(input) { context.done(null, true); }
  function failed(input) { context.done(null, false); }
  function errored(err) { context.fail(err, null); }

  var flows = [
    {func:aws_sts.assumeRoles, success:aws_trail.findTrails, failure:failed, error:errored},
    {func:aws_trail.findTrails, success:aws_trail.isLogging, failure:failed, error:errored},
    {func:aws_trail.isLogging, success:succeeded, failure:failed, error:errored},
  ];
  aws_sts.flows = flows;
  aws_trail.flows = flows;

  flows[0].func(input);
};
