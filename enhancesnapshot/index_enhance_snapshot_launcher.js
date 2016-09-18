//chandra
exports.handler = function (event, context) {

  var aws_sts = new (require('../lib/aws/sts'))();
  var aws_cfn = new (require('../lib/aws/awscfn.js'))();
  var aws_ec2 = new (require('../lib/aws/ec2.js'))();
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
  function succeeded(input) { context.done(null, input.rules);}
  function failed(input) { context.done(null, false); }
  function errored(err) { context.fail(err, null); }
  var params = {
       KeyName:event.KeyName,
       NameTag:event.NameTag,
       SourceCIDR:event.SourceCIDR,
       SshLocation:event.SshLocation,
       SubnetId:event.SubnetId,
       VolumeIOps:event.VolumeIOps,
       VolumeSize:event.VolumeSize,
       VpcId:event.VpcId,
       Eip:event.Eip
  };
    var input = {
       sessionName: sessionName,
       roles: roles,
       region: event.region,
       params:params,
       s3Url:event.url,
       Ami:event.Ami,
       account:event.account
    };
    var flows = [
       {func:aws_ec2.enableLaunchAMIPermission, success:aws_sts.assumeRoles, failure:failed, error:errored},
       {func:aws_sts.assumeRoles, success:aws_cfn.createESnapShotCFNStack, failure:failed, error:errored},
       {func:aws_cfn.createESnapShotCFNStack, success:succeeded, failure:failed, error:errored},
    ];
    aws_ec2.flows = flows;
    aws_sts.flows = flows;
    aws_cfn.flows = flows;

    flows[0].func(input);
};
