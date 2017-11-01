exports.handler = function (event, context) {

  var aws_cfn = new (require('../lib/aws/awscfn'))();
  var aws_ec2 = new (require('../lib/aws/ec2'))();
  var aws_s3 = new (require('../lib/aws/s3bucket'))();
  var aws  = require("aws-sdk");

  console.log(event);
  var sessionName = event.sessionName;
  if (sessionName == null || sessionName == "") {
    sessionName = "session";
  }
  function succeeded(input) { context.done(input.res,true);}
  function failed(input) { context.done(null, false); }
  function errored(err) { context.fail(err, false); }
  var params = {
    KeyName:event.KeyName,
    NameTag:event.NameTag,
    SourceCIDR:event.SourceCIDR,
    SshLocation:event.SshLocation,
    SubnetId:event.SubnetId,
    VolumeIOps:event.VolumeIOps,
    VolumeSize:event.VolumeSize,
    VpcId:event.VpcId,
    Eip:event.Eip,
    UUID:event.uuid
  };

  var creds = new aws.Credentials({
    accessKeyId: event.creds.AccessKeyId,
    secretAccessKey: event.creds.SecretAccessKey,
    sessionToken: event.creds.SessionToken
  });
    
  var input = {
    sessionName: sessionName,
    stackName: event.stackName,
    region: event.region,
    params:params,
    s3Url:event.url,
    Ami:event.Ami,
    account:event.account,
    creds:creds
  };
  if(event.actionType == "createStack"){
    var policy = "{\"Id\": \"Policy1474458972817\",\"Version\": \"2012-10-17\",\"Statement\": [{\"Sid\": \""+event.uuid+"\",\"Action\": [ \"s3:GetObject\" ],\"Effect\": \"Allow\",\"Resource\": \"arn:aws:s3:::"+event.bucketName+"/*\",\"Principal\": {\"AWS\":\""+event.account+"\"}}]}";
    input.bucketName = event.bucketName;
    input.policyDocument = policy;
    input.selfAccount = true;
     
    var flows = [
      {func:aws_s3.addPolicy, success:aws_ec2.enableLaunchAMIPermission, failure:failed, error:errored},
      {func:aws_ec2.enableLaunchAMIPermission, success:aws_cfn.createESnapShotCFNStack, failure:failed, error:errored},
      {func:aws_cfn.createESnapShotCFNStack, success:succeeded, failure:failed, error:errored},
    ];
    aws_ec2.flows = flows;
    aws_s3.flows = flows;
  }else if(event.actionType == "deleteStack"){
    input.bucketName = event.bucketName;
    input.selfAccount = true;
    var flows = [
      {func:aws_s3.deletePolicy, success:aws_ec2.deleteLaunchAMIPermission, failure:failed, error:errored},
      {func:aws_ec2.deleteLaunchAMIPermission, success:aws_cfn.deleteStack, failure:failed, error:errored},
      {func:aws_cfn.deleteStack, success:succeeded, failure:failed, error:errored},
    ];
    aws_ec2.flows = flows;
    aws_s3.flows = flows;
  }else if(event.actionType == "getStackStatus"){
    var flows = [
      {func:aws_cfn.getStackStatus, success:succeeded, failure:failed, error:errored},
    ];
  }
  aws_cfn.flows = flows;
  flows[0].func(input);
};
