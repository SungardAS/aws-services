

var fs = require("fs");
//data = fs.readFileSync('./sns_message_smple.json', {encoding:'utf8'});
data = fs.readFileSync('./sns_message_sim_smple.json', {encoding:'utf8'});
var event = JSON.parse(data);

var i = require('./index_notifier');
var context = {fail:function(a){console.log(a)}, done:function(e, a){console.log(a)}};
i.handler(event, context);
