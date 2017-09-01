exports.handler = function(event, context ) {


    const EVALUATION_TYPES = {
        COMPLAINT: 'COMPLIANT',
        NON_COMPLIANT: 'NON_COMPLIANT',
    }; 

    var getEvaluation = function getEvaluationParam(userId,value,timeStamp) {
        var eval = [];
        complianceType= EVALUATION_TYPES.COMPLAINT
        if(value){
            complianceType= EVALUATION_TYPES.NON_COMPLIANT
        }
        eval.push({
            ComplianceResourceType: "AWS::IAM::User" ,
            ComplianceResourceId: userId,
            ComplianceType: complianceType,
            OrderingTimestamp: timeStamp,
        });
        return eval;
    }

    var aws_sts = new (require('../lib/aws-promise/sts.js'))();
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
	console.log(event)

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
        region: ruleParameters.region,
        resourceType: invokingEvent.configurationItem.resourceType,
        resourceId: invokingEvent.configurationItem.resourceId,
        timeStamp: invokingEvent.configurationItem.configurationItemCaptureTime,
        resultToken: resultToken
    };
    var stsAssumeRolePromise = aws_sts.assumeRolesByLambda(input);
    stsAssumeRolePromise.then(function (data) {
	console.log(data)
        iamService = new (require('../lib/aws-promise/iam.js'))();
        global.creds = data;
        return iamService.getUsersWithPolicies(data);
    }).then(function(data) {
        evaluations = [];
        var aws_config = new (require('../lib/aws/awsconfig.js'))();
        keys = Object.keys(data);
        for ( var idx in keys) { 
            var evaluation = getEvaluation(keys[idx],data[keys[idx]],input.timeStamp);
            evalresult = {};
            evalresult.evaluations = evaluation;
            evalresult.resultToken = resultToken;
            evalresult.creds = global.creds;
            //TODO: Remove hardcoded region
            evalresult.region = ruleParameters.region;
            aws_config.sendEvaluations(evalresult, function(data){});
        }
    }).catch( function (err) {
        console.log("error is " + err);
    });
};
