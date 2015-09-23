
var argv = require('minimist')(process.argv.slice(2));
var module = argv._[0];
var profile = argv._[1];
if (!module || (module != 'checker' && module != 'enabler' && module != 'remover')) {
  console.log(module);
  console.log("node run_lambda checker|enabler|remover [profile]");
  return;
}

var event = {
  "federateAccount": "089476987273",
  "account": "089476987273",
  "roleExternalId": "",
  "roleName": "sgas_dev_admin",
  "sessionName": "abcde",
  "region": "us-east-1"
}
if (profile)  event.profile = profile;

var i = require('../index_' + module);
var context = {fail:function(a){console.log(a)}, done:function(e, a){console.log(a)}};
i.handler(event, context);
