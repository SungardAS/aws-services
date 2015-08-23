
var profile = "default";
var federate_account = "089476987273";
var account = "876224653878";
var roleName = "sgas_dev_admin";
var region = "us-east-1";
var sessionName = "abcde";


///// checker
var i = require('./index_checker');
var event = {
  "profile": profile,
  "federate_account": federate_account,
  "account": account,
  "roleName": roleName,
  "sessionName": sessionName,
  "region": region
}
var context = {fail:function(a){console.log(a)}, done:function(e, a){console.log(a)}};
i.handler(event, context);


///// enabler
var i = require('./index_enabler');
var event = {
  "profile": profile,
  "federate_account": federate_account,
  "account": account,
  "roleName": roleName,
  "sessionName": sessionName,
  "region": region
}
var context = {fail:function(a){console.log(a)}, done:function(e, a){console.log(a)}};
i.handler(event, context);


///// remover
var i = require('./index_remover');
var event = {
  "profile": profile,
  "federate_account": federate_account,
  "account": account,
  "roleName": roleName,
  "sessionName": sessionName,
  "region": region
}
var context = {fail:function(a){console.log(a)}, done:function(e, a){console.log(a)}};
i.handler(event, context);
