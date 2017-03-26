exports.handler = function (event, context) {

  var aws_sts = new (require('../lib/aws/sts'))();
  var aws_cfn = new (require('../lib/aws/awscfn'))();
  var aws_ec2 = new (require('../lib/aws/ec2'))();
  var aws_s3 = new (require('../lib/aws/s3bucket'))();
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
  console.log(event);

  var sessionName = event.sessionName;
  if (sessionName == null || sessionName == "") {
    sessionName = "session";
  }
  function succeeded(input) { context.done(null,true);}
  function failed(input) { context.done(null, false); }
  function errored(err) { context.fail(err, false); }

  var input = {
     sessionName: sessionName,
     roles: roles,
     region: event.region,
     stackName: event.stackName,
     params:event.params,
     s3Url:event.url,
     account:event.account
  };
  if(event.actionType == "createStack"){
        var policy = {
            "Version": "2012-10-17",
            "Id": "PolicyID-" + event.UUID,
            "Statement": [
                {
                    "Sid": event.account,
                    "Effect": "Allow",
                    "Principal": {
                        "AWS": event.account
                    },
                    "Action": "s3:GetObject",
                    "Resource": "arn:aws:s3:::" + event.bucketName + "/*"
                }
            ]
        };
        input.bucketName = event.bucketName;
        input.policyDocument = JSON.stringify(policy);
        input.account = event.account;
     
        var flows = [
           {func:aws_s3.updatePolicy, success:aws_sts.assumeRoles, failure:failed, error:errored},
           {func:aws_sts.assumeRoles, success:aws_cfn.createCfnStack, failure:failed, error:errored},
           {func:aws_cfn.createCfnStack, success:succeeded, failure:failed, error:errored},
        ];
        aws_ec2.flows = flows;
        aws_s3.flows = flows;
  }else if(event.actionType == "deleteStack"){
        input.bucketName = event.bucketName;
        var flows = [
           //{func:aws_s3.deletePolicy, success:aws_sts.assumeRoles, failure:failed, error:errored},
           {func:aws_sts.assumeRoles, success:aws_cfn.deleteStack, failure:failed, error:errored},
           {func:aws_cfn.deleteStack, success:succeeded, failure:failed, error:errored},
        ];
        aws_ec2.flows = flows;
        aws_s3.flows = flows;
  }else if(event.actionType == "getStackStatus"){
        var flows = [
          {func:aws_sts.assumeRoles, success:aws_cfn.getStackStatus, failure:failed, error:errored},
          {func:aws_cfn.getStackStatus, success:succeeded, failure:failed, error:errored},
        ];
  }else if(event.actionType == "updateStack"){
      var flows = [
          //{func:aws_s3.addPolicy, success:aws_sts.assumeRoles, failure:failed, error:errored},
          {func:aws_sts.assumeRoles, success:aws_cfn.updateCfnStack, failure:failed, error:errored},
          {func:aws_cfn.updateCfnStack, success:succeeded, failure:failed, error:errored}
      ];
  }
  aws_sts.flows = flows;
  aws_cfn.flows = flows;
  flows[0].func(input);
};
