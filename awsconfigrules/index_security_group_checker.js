
exports.handler = function (event, context) {

    var aws_sts = new (require('../lib/aws/lambda'))();
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

    if (!ruleParameters) ruleParameters = {"vpcId": event.vpcId, "region": event.region, "groupName": event.groupName};

    if (invokingEvent) invokingEvent = JSON.parse(invokingEvent);
    else invokingEvent = {"configurationItem": {"resourceType": "EC2 VPC", "resourceId": event.vpcId, "configurationItemCaptureTime": new Date()}};

    if(event.resultToken) var resultToken = event.resultToken;
    else var resultToken = "110ec58a-a0f2-4ac4-8393-c866d813b8d1";

    var input = {
        sessionName: sessionName,
        roles: roles,
        region: ruleParameters.region,
        groupName: ruleParameters.groupName,
        resourceType: invokingEvent.configurationItem.resourceType,
        resourceId: invokingEvent.configurationItem.resourceId,
        timeStamp: invokingEvent.configurationItem.configurationItemCaptureTime,
        resultToken: resultToken
    };

    if(ruleParameters.vpcId) {
        input.vpcId = ruleParameters.vpcId;
    }

    function succeeded(input) { context.done(null, true); }
    function failed(input) { context.done(null, false); }
    function errored(err) { context.fail(err, null); }

    var flows = [
        {func:aws_sts.assumeRolesByLambda, success:aws_ec2.securityGroupHasRules, failure:failed, error:errored},
        {func:aws_ec2.securityGroupHasRules, success:aws_config.sendEvaluations, failure:aws_config.sendEvaluations, error:errored},
        {func:aws_config.sendEvaluations, success:succeeded, failure:failed, error:errored},
    ];
    aws_ec2.flows = flows;
    aws_sts.flows = flows;
    aws_config.flows = flows;

    flows[0].func(input);
};
