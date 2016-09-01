exports.handler = function(event, context ) {

    var aws_sts = new (require('../lib/aws/sts2.js'))();
    var aws_ec2 = new (require('../lib/aws/ec2.js'))();
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

    var invokingEvent = event.invokingEvent;

    if (!ruleParameters) ruleParameters = {"region": event.region};

    if (invokingEvent) invokingEvent = JSON.parse(invokingEvent);
    else invokingEvent = {"configurationItem": {"resourceType": "IAM USER", "configurationItemCaptureTime": new Date()}};

    if(event.resultToken) var resultToken = event.resultToken;
    else var resultToken = "110ec58a-a0f2-4ac4-8393-c866d813b8d1";

    var input = {
        sessionName: sessionName,
        roles: roles,
        vpcId: ruleParameters.vpcId,
        region: ruleParameters.region,
        groupName: ruleParameters.groupName,
        resourceType: invokingEvent.configurationItem.resourceType,
        resourceId: invokingEvent.configurationItem.resourceId,
        timeStamp: invokingEvent.configurationItem.configurationItemCaptureTime,
        resultToken: resultToken
    };
    console.log("Before assumerole and input == " + input);
    var stsAssumeRolePromise = aws_sts.assumeRoles(input).promise();
    stsAssumeRolePromise.then(function(data) {
        console.log("Inside assumeRole.then");
        iamService = new (require('../lib/aws/iam.js'))();
        return iamService.getUsersWithPolicies().promise();
    }).then(function(data) {
        var aws_config = new (require('../lib/aws/awsconfig.js'))();
        return aws_config.sendEvaluation().promise();
    }).catch(function(err) {
        console.log("Error occurred: ");
        console.log(err);
    });
};
