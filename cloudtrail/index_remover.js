
exports.handler = function (event, context) {

  var aws_sts = new (require('../lib/aws/lambda'))();
  var aws_trail = new (require('../lib/aws/cloudtrail.js'))();

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

  var fs = require("fs");
  data = fs.readFileSync(__dirname + '/json/data.json', {encoding:'utf8'});
  data_json = JSON.parse(data);

  var input = {
    sessionName: sessionName,
    roles: roles,
    region: event.region,
    trailName: data_json.trailName
  };

  function succeeded(input) { context.done(null, true); }
  function failed(input) { context.done(null, false); }
  function errored(err) { context.fail(err, null); }

  var flows = [
    {func:aws_sts.assumeRoles, success:aws_trail.findTrails, failure:failed, error:errored},
    {func:aws_trail.findTrails, success:aws_trail.isLogging, failure:succeeded, error:errored},
    {func:aws_trail.isLogging, success:aws_trail.stopLogging, failure:aws_trail.deleteTrail, error:errored},
    {func:aws_trail.stopLogging, success:aws_trail.deleteTrail, failure:failed, error:errored},
    {func:aws_trail.deleteTrail, success:succeeded, failure:failed, error:errored},
  ];
  aws_sts.flows = flows;
  aws_trail.flows = flows;

  flows[0].func(input);
};
