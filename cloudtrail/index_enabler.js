
exports.handler = function (event, context) {

  var aws_sts = new (require('../lib/aws/sts'))();
  var aws_bucket = new (require('../lib/aws/s3bucket.js'))();
  var aws_trail = new (require('../lib/aws/cloudtrail.js'))();

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
  var data = fs.readFileSync(__dirname + '/json/data.json', {encoding:'utf8'});
  var data_json = JSON.parse(data);

  var bucketName = event.account + data_json.bucketNamePostfix;
  var resources = [
    'arn:aws:s3:::' + bucketName,
    'arn:aws:s3:::' + bucketName + '/AWSLogs/' + event.account + '/*'];
  data = fs.readFileSync(__dirname + '/json/' + data_json.bucketPolicyName + '.json', {encoding:'utf8'});
  var policyDoc = JSON.parse(data);
  for(var i = 0; i < resources.length; i++) {
    policyDoc.Statement[i].Resource = resources[i];
  }
  policyDoc = JSON.stringify(policyDoc);

  var input = {
    sessionName: sessionName,
    roles: roles,
    region: event.region,
    trailName: data_json.trailName,
    bucketName: bucketName,
    policyDocument: policyDoc
  };

  function succeeded(input) { context.done(null, true); }
  function failed(input) { context.done(null, false); }
  function errored(err) { context.fail(err, null); }

  var flows = [
    {func:aws_sts.assumeRoles, success:aws_bucket.findBucket, failure:failed, error:errored},
    {func:aws_bucket.findBucket, success:aws_trail.findTrails, failure:aws_bucket.createBucket, error:errored},
    {func:aws_bucket.createBucket, success:aws_bucket.addPolicy, failure:failed, error:errored},
    {func:aws_bucket.getPolicy, success:aws_trail.findTrails, failure:aws_bucket.addPolicy, error:errored},
    {func:aws_bucket.addPolicy, success:aws_trail.findTrails, failure:failed, error:errored},
    {func:aws_trail.findTrails, success:aws_trail.isLogging, failure:aws_trail.createTrail, error:errored},
    {func:aws_trail.createTrail, success:aws_trail.startLogging, failure:failed, error:errored},
    {func:aws_trail.isLogging, success:succeeded, failure:aws_trail.startLogging, error:errored},
    {func:aws_trail.startLogging, success:succeeded, failure:failed, error:errored},
  ];
  aws_sts.flows = flows;
  aws_bucket.flows = flows;
  aws_trail.flows = flows;

  flows[0].func(input);
};
