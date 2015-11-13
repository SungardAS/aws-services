
var argv = require('minimist')(process.argv.slice(2));
var handler = argv._[0];
if (!handler) {
  console.log(handler);
  console.log("node run_lambda <handler file name without '.js'>");
  return;
}
console.log('handler = ' + handler);

var fs = require("fs");
var data = fs.readFileSync('./sample_' + handler + '.json', {encoding:'utf8'});
var event = JSON.parse(data);
if (event.Records) {
  var message = JSON.parse(event.Records[0].Sns.Message);
  message.StateChangeTime = new Date();
  event.Records[0].Sns.Message = JSON.stringify(message);
}

var iam = new (require('../../lib/aws/role'))();
iam.findAccountId({}, function(err, data) {
  if (err) {
    console.log('failed to find account id : ' + err);
  }
  else {
    console.log("");
    console.log('####Currently testing in ACCOUNT [' + data + ']');
    console.log("");
    var i = require('../' + handler + ".js");
    var context = {fail:function(a){console.log(a)}, done:function(e, a){console.log(a)}};
    i.handler(event, context);
  }
});
