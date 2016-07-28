
exports.handler = function (event, context) {

    var aws_sts = new (require('../lib/aws/sts'))();
    var aws_ec2 = new (require('../lib/aws/ec2.js'))();
    var aws_config = new (require('../lib/aws/awsconfig.js'))();

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

    var vpc_id = event.vpcId,
        region = event.region,
        group_name = event.groupName;

    if (event.invokingEvent){
        var invokingEvent = JSON.parse(event.invokingEvent);
    }else{
        var invokingEvent = {"configurationItem": {"resourceType": "EC2 VPC",
            "resourceId": vpc_id, "configurationItemCaptureTime": new Date()}}
    }
    if(event.resultToken) var resultToken = event.resultToken;
    else var resultToken = "110ec58a-a0f2-4ac4-8393-c866d813b8d1";

    var input = {
        sessionName: sessionName,
        roles: roles,
        vpcId: vpc_id,
        region: region,
        groupName: group_name,
        resourceType: invokingEvent.configurationItem.resourceType,
        resourceId: invokingEvent.configurationItem.resourceId,
        timeStamp: invokingEvent.configurationItem.configurationItemCaptureTime,
        complianceType: 'COMPLIANT',
        resultToken: resultToken
    };

    function succeeded(input) { context.done(null, true); }
    function failed(input) { context.done(null, false); }
    function errored(err) { context.fail(err, null); }

    var flows = [
        {func:aws_sts.assumeRoles, success:aws_ec2.securityGroupHasRules, failure:failed, error:errored},
        {func:aws_ec2.securityGroupHasRules, success:aws_config.sendEvaluation, failure:failed, error:errored}
    ];
    aws_ec2.flows = flows;
    aws_sts.flows = flows;
    aws_config.flows = flows;

    flows[0].func(input);
};