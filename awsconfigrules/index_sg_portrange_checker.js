
exports.handler = function (event, context) {

    var aws_sts = new (require('../lib/aws/sts'))();
    var aws_sg = new (require('../lib/aws/sg-range.js'))();
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

    //console.log("111###############");
    //console.log(event);
    //console.log("222###############");
    //console.log(invokingEvent);
    var invokingEvent = event.invokingEvent;
    if (invokingEvent) invokingEvent = JSON.parse(invokingEvent);
    //else invokingEvent = {"configurationItem": {"resourceType": "SG", "resourceId": event.region, "configurationItemCaptureTime": new Date()}};
    else invokingEvent = {"configurationItem": {"resourceType": "SecurityGroup","resourceId": event.region, "configurationItemCaptureTime": new Date()}};

    if(event.resultToken) var resultToken = event.resultToken;
    else var resultToken = "110ec58a-a0f2-4ac4-8393-c866d813b8d1";

    var input = {
        sessionName: sessionName,
        roles: roles,
        region: ruleParameters.region,
        resourceType: invokingEvent.configurationItem.resourceType,
        //resourceId: invokingEvent.configurationItem.resourceId,
        timeStamp: invokingEvent.configurationItem.configurationItemCaptureTime,
        startPort: ruleParameters.startPort,
        endPort: ruleParameters.endPort,
        resultToken: resultToken
    };

    function succeeded(input) { context.done(null, true); }
    function failed(input) { context.done(null, false); }
    function errored(err) { context.fail(err, null); }

    var flows = [
        {func:aws_sts.assumeRoles, success:aws_sg.sgInboundRulesHasPortRange, failure:failed, error:errored},
        {func:aws_sg.sgInboundRulesHasPortRange, success:aws_config.sendEvaluation, failure:aws_config.sendEvaluation, error:errored},
        //{func:aws_config.sendEvaluation, success:succeeded, failure:failed, error:errored},
    ];
    aws_sg.flows = flows;
    aws_sts.flows = flows;
    aws_config.flows = flows;

    flows[0].func(input);
};
