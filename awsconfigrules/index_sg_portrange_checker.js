
exports.handler = function (event, context) {

    var aws_sg = new (require('../lib/aws/sg-range.js'))();
    var aws_config = new (require('../lib/aws/awsconfig.js'))();
    var aws  = require("aws-sdk");
    if (event.ruleParameters){
        var ruleParameters = JSON.parse(event.ruleParameters);
        event.federateRoleName = ruleParameters.federateRoleName;
        event.federateAccount = ruleParameters.federateAccount;
        event.account = ruleParameters.account;
        event.roleName = ruleParameters.roleName;
        event.roleExternalId = ruleParameters.roleExternalId;
    }

    var creds = new aws.Credentials({
      accessKeyId: event.creds.AccessKeyId,
      secretAccessKey: event.creds.SecretAccessKey,
      sessionToken: event.creds.SessionToken
    });


    var sessionName = event.sessionName;
    if (sessionName == null || sessionName == "") {
        sessionName = "session";
    }

    var invokingEvent = event.invokingEvent;
    if (invokingEvent) invokingEvent = JSON.parse(invokingEvent);
    else invokingEvent = {"configurationItem": {"resourceType": "SecurityGroup","resourceId": event.region, "configurationItemCaptureTime": new Date()}};

    if(event.resultToken) var resultToken = event.resultToken;
    else var resultToken = "110ec58a-a0f2-4ac4-8393-c866d813b8d1";

    var input = {
        sessionName: sessionName,
        region: ruleParameters.region,
        resourceType: invokingEvent.configurationItem.resourceType,
        timeStamp: invokingEvent.configurationItem.configurationItemCaptureTime,
        startPort: ruleParameters.startPort,
        endPort: ruleParameters.endPort,
        resultToken: resultToken,
        creds:creds
    };

    function succeeded(input) { context.done(null, true); }
    function failed(input) { context.done(null, false); }
    function errored(err) { context.fail(err, null); }

    var flows = [
        {func:aws_sg.sgInboundRulesHasPortRange, success:aws_config.sendEvaluation, failure:aws_config.sendEvaluation, error:errored},
    ];
    aws_sg.flows = flows;
    aws_config.flows = flows;

    flows[0].func(input);
};
