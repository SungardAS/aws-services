
exports.handler = function (event, context) {

    var aws_sts = new (require('../lib/aws/sts'))();
//    var aws_bucket = new (require('./aws/s3bucket.js'))();
    var aws_bucket = new (require('../lib/aws/s3-logging.js'))();
    var aws_config = new (require('../lib/aws/awsconfig.js'))();
    
   if (event.ruleParameters){
        var ruleParameters = JSON.parse(event.ruleParameters);
        event.federateRoleName = ruleParameters.federateRoleName;
        event.federateAccount = ruleParameters.federateAccount;
        event.account = ruleParameters.account;
        event.roleName = ruleParameters.roleName;
        event.roleExternalId = ruleParameters.roleExternalId;
    }

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
  var data = fs.readFileSync(__dirname + '/json/data.json', {encoding:'utf8'});
  var data_json = JSON.parse(data);

  var bucketName = event.account + data_json.bucketNamePostfix + "." + event.region;


    var invokingEvent = event.invokingEvent;

    if (!ruleParameters) ruleParameters = {"s3BucketName": bucketName, "region": event.region};

    if (invokingEvent) invokingEvent = JSON.parse(invokingEvent);
    else invokingEvent = {"configurationItem": {"resourceType": "s3Bucket", "configurationItemCaptureTime": new Date()}};

    if(event.resultToken) var resultToken = event.resultToken;
    else var resultToken = "110ec58a-a0f2-4ac4-8393-c866d813b8d1";

    var input = {
        sessionName: sessionName,
        roles: roles,
        region: ruleParameters.region,
        bucketName: ruleParameters.bucketName,
  //      bucketName: bucketName
        resourceType: invokingEvent.configurationItem.resourceType,
//        resourceId: invokingEvent.configurationItem.resourceId,
        timeStamp: invokingEvent.configurationItem.configurationItemCaptureTime,
        resultToken: resultToken
    };

    function succeeded(input) { context.done(null, true); }
    function failed(input) { context.done(null, false); }
    function errored(err) { context.fail(err, null); }

    var flows = [
        {func:aws_sts.assumeRoles, success:aws_bucket.findBucket, failure:failed, error:errored},
        {func:aws_bucket.findBucket, success:aws_bucket.findBucketLogging, failure:failed, error:errored},
        {func:aws_bucket.findBucketLogging, success:aws_config.sendEvaluation, failure:aws_config.sendEvaluation, error:errored},
        {func:aws_config.sendEvaluation, success:succeeded, failure:failed, error:errored},
    ];
    aws_sts.flows = flows;
    aws_config.flows = flows;
    aws_bucket.flows = flows;

    flows[0].func(input);
};
