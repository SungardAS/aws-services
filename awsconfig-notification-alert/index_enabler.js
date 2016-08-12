
exports.handler = function (event, context) {

  var aws_topic = new (require('../lib/aws/topic.js'))();
  var aws_role = new (require('../lib/aws/role.js'))();
  var aws_lambda = new (require('../lib/aws/lambda.js'))(); 


  var fs = require("fs");
  data = fs.readFileSync(__dirname + '/json/data.json', {encoding:'utf8'});
  data_json = JSON.parse(data);


var input = {
    region: event.region,
    topicName : data_json.topicName,
    functionName : data_json.saverFuncName,
    roleName : data_json.roleName + "-" + event.region,
    roleNamePostfix: (new Date()).getTime(),
    inlinePolicyName : data_json.inlinePolicyName,
    inlinePolicyDocument: inlinePolicyDocument,
    roleArn : null,
    topicArn : null,
    inlinePolicyDoc : null
  };

  function succeeded(input) { context.done(null, true); }
  function failed(input) { context.done(null, false); }
  function errored(err) { context.fail(err, null); }

  var flows = [
    {func:aws_role.createRole, success:aws_role.findInlinePolicy, failure:failed, error:errored},
    {func:aws_role.findInlinePolicy, success:aws_topic.findTopic, failure:aws_role.createInlinePolicy, error:errored},
    {func:aws_role.createInlinePolicy, success:aws_role.wait, failure:failed, error:errored},
    {func:aws_role.wait, success:aws_topic.findTopic, failure:failed, error:errored},
    {func:aws_topic.findTopic, success:aws_lambda.findFunction, failure:aws_topic.createTopic, error:errored},
    {func:aws_topic.createTopic, success:aws_lambda.findFunction, failure:failed, error:errored},
    {func:aws_lambda.findFunction, success:aws_topic.subscribeLambda, failure:failed, error:errored},
    {func:aws_topic.subscribeLambda, success:succeeded, failure:failed, error:errored},
  ];
  aws_topic.flows = flows;
  aws_role.flows = flows;
  aws_lambda.flows = flows;

  flows[0].func(input);
};
