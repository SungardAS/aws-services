

var fs = require("fs");
//data = fs.readFileSync('./sns_message_sample.json', {encoding:'utf8'});
data = fs.readFileSync('./sns_message_sim_sample.json', {encoding:'utf8'});
var event = JSON.parse(data);
var message = JSON.parse(event.Records[0].Sns.Message);
message.StateChangeTime = new Date();
event.Records[0].Sns.Message = JSON.stringify(message);
event.profile = 'default';

var i = require('./index');
var context = {fail:function(a){console.log(a)}, done:function(e, a){console.log(a)}};
i.handler(event, context);
