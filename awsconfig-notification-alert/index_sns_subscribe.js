
exports.handler = function (event, context) {

  var aws_topic = new (require('../lib/aws/topic.js'))();
  var aws_lambda = new (require('../lib/aws/lambda.js'))(); 


  var fs = require("fs");
  data = fs.readFileSync(__dirname + '/json/data.json', {encoding:'utf8'});
  data_json = JSON.parse(data);


var input = {
    region: event.region,
    topicName : data_json.topicName,
    functionName : data_json.saverFuncName,
    topicArn : null,
  };

  function succeeded(input) { context.done(null, true); }
  function failed(input) { context.done(null, false); }
  function errored(err) { context.fail(err, null); }

  var flows = [
    {func:aws_topic.findTopic, success:aws_lambda.findFunction, failure:aws_topic.createTopic, error:errored},
    {func:aws_topic.createTopic, success:aws_lambda.findFunction, failure:failed, error:errored},
    {func:aws_lambda.findFunction, success:aws_topic.subscribeLambda, failure:failed, error:errored},
    {func:aws_topic.subscribeLambda, success:succeeded, failure:failed, error:errored},
  ];
  aws_topic.flows = flows;
  aws_lambda.flows = flows;

  flows[0].func(input);
};
