
exports.handler = function (event, context) {

  console.log(JSON.stringify(event));
  var region = event.Records[0].EventSubscriptionArn.split(":")[3];
  console.log("region = " + region);

  var aws_queue = new (require('../lib/aws/queue.js'))();

  var fs = require("fs");
  data = fs.readFileSync(__dirname + '/json/data.json', {encoding:'utf8'});
  data_json = JSON.parse(data);


  var input = {
    profile: (event.profile === undefined) ? null : event.profile,
    region: region,
    queueName : data_json.queueName,
    messageBody : data_json.messageBody,
    delaySeconds : data_json.delaySeconds,
  };

  var flows = [
    {func:aws_queue.createQueue, success:aws_queue.purgeQueue, failure:context.fail, error:context.fail},
    {func:aws_queue.purgeQueue, success:aws_queue.sendMessage, failure:context.fail, error:context.fail},
    {func:aws_queue.sendMessage, success:done, failure:context.fail, error:context.fail},
  ]
  input.flows = flows;
  aws_queue.flows = flows;

  function done(input) { context.done(null, true); }

  flows[0].func(input);
};
