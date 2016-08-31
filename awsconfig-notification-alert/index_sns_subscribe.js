exports.handler = function (event, context) {
var provider = new (require('../lib/aws/assume_role_provider'))();
var aws_topic = new (require('../lib/aws/topic.js'))();
var aws_lambda = new (require('../lib/aws/lambda.js'))(); 
var aws_sts = new (require('../lib/aws/sts.js'))();
var AWS = require('aws-sdk');

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
  
  
var input = {
    sessionName: sessionName,
    roles: roles,
    region: event.region,
    //topicName : data_json.topicName,
    topicName: event.topicName,
    functionName : data_json.saverFuncName,
//    sourceArn:  data_json.sourceArn,
//    AccountId: data_json.AccountId,
    AccountId: event.AccountId,
    statementId: event.statementId, //unique string, some uuid from api
    topicArn : null,
    functionArn: null,
    sourceArn : null,
    creds : null
  };

   
   var me = this;
   
   function getAuth(input)
   {
	   console.log(input);

	provider.getCredential(roles,sessionName,0,null, function(err, data) {
      if(err) {
        console.log("failed to get credential : " + err);
        callback(err);
      }
      else {
 //       console.log(data);
        input.creds = data;
    	console.log(">>>>>>>>>>>>>> Exiting from getAuth")
		aws_topic.findTopic(input);
      }
    }); 
   }
   
   function findLambdaFunction(input)
   {
     console.log('<<<Starting find Lambda function...');	  
	  aws_lambda.findFunction(input);
	   input.sourceArn = input.topicArn;
   }
  function addTopicPermisson(input) {
	console.log('<<<Starting add sns topic Permission function...');
    aws_topic.addPermission(input);
    input.creds = null;
  }
  

  function succeeded(input) { context.done(null, true); }
  function failed(input) { console.log(">>>>>  fail >>>>>");context.done(null, false); }
  function errored(err) { context.fail(err, null); }

    var flows = [
        {func:getAuth, success:aws_topic.findTopic, failure:failed, error:errored},
	{func:aws_topic.findTopic, success:addTopicPermisson, failure:aws_topic.createTopic, error:errored},
        {func:aws_topic.createTopic, success:addTopicPermisson, failure:failed, error:errored},
        {func:addTopicPermisson, success:aws_topic.addPermission, failure:failed, error:errored},
	{func:aws_topic.addPermission, success:findLambdaFunction, failure:failed, error:errored},
	{func:findLambdaFunction, success:aws_lambda.findFunction, failure:failed, error:errored},
	{func:aws_lambda.findFunction, success:aws_lambda.addPermission, failure:failed, error:errored},
	{func:aws_lambda.addPermission, success:aws_topic.subscribeLambda, failure:failed, error:errored},
	{func:aws_topic.subscribeLambda, success:succeeded, failure:failed, error:errored},
    ]
    
    aws_lambda.flows = flows;
    aws_topic.flows = flows;
	
flows[0].func(input);
};
