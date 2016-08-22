
exports.handler = function (event, context) {

  var aws_topic = new (require('../lib/aws/topic.js'))();
  var aws_lambda = new (require('../lib/aws/lambda.js'))(); 
  var aws_sts = new (require('../lib/aws/sts'))();

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
  data = fs.readFileSync(__dirname + '/json/data.json', {encoding:'utf8'});
  data_json = JSON.parse(data);

var topicArn = "arn:aws:sns:" + event.region + ":" + event.account + ":" + data_json.topicName;
var functionArn = "arn:aws:lambda:" + event.region + ":" + event.federateAccount + ":function:" + data_json.saverFuncName;
//var action = [];
 //action.push({data_json.actionName[0]});
//console.log(action);
var input = {
    sessionName: sessionName,
    roles: roles,
    region: event.region,
    topicName : data_json.topicName,
    functionName : data_json.saverFuncName,
  //  principal: event.principal,
//    sourceArn:  data_json.sourceArn,
//    sourceAccount: data_json.sourceAccount,
      sourceAccount: event.sourceAccount,
//    AccountId: data_json.AccountId,
    actionName: event.action,
//    actionName: data_json.actionName,
    statementId: event.statementId, //unique string, some uuid from api
    topicArn : null,
    functionArn : functionArn,
    sourceArn : topicArn
  };

  function succeeded(input) { context.done(null, true); }
  function failed(input) { context.done(null, false); }
  function errored(err) { context.fail(err, null); }

  var flows = [
    {func:aws_lambda.addPermission, success:aws_sts.assumeRoles, failure:failed, error:errored},
    {func:aws_sts.assumeRoles, success:aws_topic.findTopic, failure:failed, error:errored},
    {func:aws_topic.findTopic, success:aws_topic.addPermission, failure:aws_topic.createTopic, error:errored},
    {func:aws_topic.createTopic, success:aws_topic.addPermission, failure:failed, error:errored},
    {func:aws_topic.addPermission, success:aws_topic.subscribeLambda, failure:failed, error:errored},
    {func:aws_topic.subscribeLambda, success:succeeded, failure:failed, error:errored},
  
 //{func:aws_lambda.findFunction, success:aws_lambda.addPermission, failure:failed, error:errored},
   // {func:aws_lambda.addPermission, success:aws_sts.assumeRoles, failure:failed, error:errored},
    //{func:aws_sts.assumeRoles, success:aws_topic.findTopic, failure:failed, error:errored},
   // {func:aws_topic.findTopic, success:aws_topic.subscribeLambda, failure:aws_topic.createTopic, error:errored},
   // {func:aws_topic.createTopic, success:aws_topic.subscribeLambda, failure:failed, error:errored},
  //  {func:aws_topic.subscribeLambda, success:succeeded, failure:failed, error:errored},
  ];
  aws_topic.flows = flows;
  aws_lambda.flows = flows;
  aws_sts.flows = flows;

  flows[0].func(input);
};
