
exports.handler = function (event, context) {

    var aws_ec2 = new (require('../lib/aws/ec2.js'))();
    var aws_config = new (require('../lib/aws/awsconfig.js'))();

    var sessionName = event.sessionName;
    if (sessionName == null || sessionName == "") {
        sessionName = "session";
    }

    var ruleParameters = event.ruleParameters,
        invokingEvent = event.invokingEvent;

    if (ruleParameters) ruleParameters = JSON.parse(ruleParameters);
    else ruleParameters = {"vpcId": event.vpcId, "region": event.region, "groupName": event.groupName};

    if (invokingEvent) invokingEvent = JSON.parse(invokingEvent);
    else invokingEvent = {"configurationItem": {"resourceType": "EC2 VPC", "resourceId": event.vpcId, "configurationItemCaptureTime": new Date()}};

    if(event.resultToken) var resultToken = event.resultToken;
    else var resultToken = "110ec58a-a0f2-4ac4-8393-c866d813b8d1";

    var input = {
        vpcId: ruleParameters.vpcId,
        region: ruleParameters.region,
        groupName: ruleParameters.groupName,
        resourceType: invokingEvent.configurationItem.resourceType,
        resourceId: invokingEvent.configurationItem.resourceId,
        timeStamp: invokingEvent.configurationItem.configurationItemCaptureTime,
        resultToken: resultToken
    };

    function succeeded(input) { context.done(null, true); }
    function failed(input) { context.done(null, false); }
    function errored(err) { context.fail(err, null); }

    var flows = [
        {func:aws_ec2.securityGroupHasRules, success:aws_config.sendEvaluation, failure:aws_config.sendEvaluation, error:errored},
        {func:aws_config.sendEvaluation, success:succeeded, failure:failed, error:errored},
    ];
    aws_ec2.flows = flows;
    aws_config.flows = flows;

    flows[0].func(input);
};