
exports.handler = function (event, context) {

  var aws_topic = new (require('../lib/topic.js'))();
  var aws_config = new (require('../lib/awsconfig.js'))();

  var fs = require("fs");
  data = fs.readFileSync(__dirname + '/data.json', {encoding:'utf8'});
  data_json = JSON.parse(data);

  var input = {
    profile: (event.profile === undefined) ? null : event.profile,
    region: event.region,
    topicName : data_json.topicName
  };

  var flows = [
    {func:aws_config.findRecorders, success:aws_config.findRecordersStatus, failure:aws_config.findChannels, error:context.fail},
    {func:aws_config.findRecordersStatus, success:aws_config.stopRecorder, failure:aws_config.findChannels, error:context.fail},
    {func:aws_config.stopRecorder, success:aws_config.findChannels, failure:context.fail, error:context.fail},
    {func:aws_config.findChannels, success:aws_config.deleteChannel, failure:aws_topic.findTopic, error:context.fail},
    {func:aws_config.deleteChannel, success:aws_topic.findTopic, failure:context.fail, error:context.fail},
    {func:aws_topic.findTopic, success:aws_topic.deleteTopic, failure:done, error:context.fail},
    {func:aws_topic.deleteTopic, success:done, failure:context.fail, error:context.fail},
  ]
  aws_topic.flows = flows;
  aws_config.flows = flows;

  function done(input) { context.done(null, true); }

  flows[0].func(input);

};
