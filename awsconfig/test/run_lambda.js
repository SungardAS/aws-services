
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
  "__account": "876224653878",
  "__roleExternalId": "4e709cfd-e41b-4425-84cb-64461f23465c",
  "account": "089476987273",
  "roleExternalId": "88df904d-c597-40ef-8b29-b767aba1eaa4",
  "roleName": "sgas_dev_admin",
  "sessionName": "abcde",
  "region": "us-east-1"
}
if (profile)  event.profile = profile;

var i = require('../index_' + module);
var context = {fail:function(a){console.log(a)}, done:function(e, a){console.log(a)}};
i.handler(event, context);
