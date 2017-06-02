
exports.handler = function (event, context) {

  var aws_sts = new (require('../lib/aws/sts'))();
  var aws_bucket = new (require('../lib/aws/s3bucket.js'))();
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

  // http://docs.aws.amazon.com/awscloudtrail/latest/userguide/cloudtrail-supported-regions.html
  var rootAccounts = {
    "ap-southeast-1": "arn:aws:iam::903692715234:root",
    "eu-west-1": "arn:aws:iam::859597730677:root",
    "sa-east-1": "arn:aws:iam::814480443879:root",
    "ap-northeast-1": "arn:aws:iam::216624486486:root",
    "us-east-1": "arn:aws:iam::086441151436:root",
    "us-west-1": "arn:aws:iam::388731089494:root",
    "ap-southeast-2": "arn:aws:iam::284668455005:root",
    "us-west-2": "arn:aws:iam::113285607260:root",
    "eu-central-1": "arn:aws:iam::035351147821:root",
    "ap-northeast-2": "arn:aws:iam::492519147666:root",
    "ap-south-1": "arn:aws:iam::977081816279:root",
    "us-east-2": "arn:aws:iam::475085895292:root",
    "eu-west-2": "arn:aws:iam::282025262664:root",
    "ca-central-1": "arn:aws:iam::819402241893:root"
  };

  // find root account id for that region
  var rootAccount = rootAccounts[event.region];
  console.log('root account = ' + rootAccount);
  if (!rootAccount) {
    context.fail("cannot enable the service because no root account is found in region " + event.region, null);
  }

  var fs = require("fs");
  var data = fs.readFileSync(__dirname + '/json/data.json', {encoding:'utf8'});
  var data_json = JSON.parse(data);

  var bucketName = event.account + data_json.bucketNamePostfix + "." + event.region;
  var resources = [
    'arn:aws:s3:::' + bucketName,
    'arn:aws:s3:::' + bucketName + '/AWSLogs/' + event.account + '/*'];
  data = fs.readFileSync(__dirname + '/json/' + data_json.bucketPolicyName + '.json', {encoding:'utf8'});
  var policyDoc = JSON.parse(data);
  for(var i = 0; i < resources.length; i++) {
    policyDoc.Statement[i].Principal.AWS.push(rootAccount);
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
  if (event.multiRegion)  input.multiRegion = event.multiRegion;

  function succeeded(input) { context.done(null, true); }
  function failed(input) { context.done(null, false); }
  function errored(err) { context.fail(err, null); }

  var flows = [
    {func:aws_sts.assumeRoles, success:aws_bucket.findBucket, failure:failed, error:errored},
    {func:aws_bucket.findBucket, success:aws_trail.findTrails, failure:aws_bucket.createBucket, error:errored},
    {func:aws_bucket.createBucket, success:aws_bucket.addPolicy, failure:failed, error:errored},
    {func:aws_bucket.addPolicy, success:aws_trail.findTrails, failure:failed, error:errored},
    {func:aws_trail.findTrails, success:aws_trail.isLogging, failure:aws_trail.createTrail, error:errored},
    {func:aws_trail.createTrail, success:aws_trail.startLogging, failure:failed, error:errored},
    {func:aws_trail.isLogging, success:succeeded, failure:aws_trail.startLogging, error:errored},
    {func:aws_trail.startLogging, success:succeeded, failure:failed, error:errored}
  ];
  aws_sts.flows = flows;
  aws_bucket.flows = flows;
  aws_trail.flows = flows;

  flows[0].func(input);
};
