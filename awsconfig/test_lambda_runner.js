
var region = 'us-east-1';
var profile = 'default';
var account = '290093585298';


///// checker
var i = require('./index_checker');
var event = {
  profile: profile,
  region: region,
  account: account
}
var context = {fail:function(a){console.log(a)}, done:function(e, a){console.log(a)}};
i.handler(event, context);


///// enabler
var i = require('./index_enabler');
var event = {
  profile: profile,
  region : region,
  account: account
}
var context = {fail:function(a){console.log(a)}, done:function(e, a){console.log(a)}};
i.handler(event, context);


///// remover
var i = require('./index_remover');
var event = {
  profile: profile,
  region : region,
  account: account
}
var context = {fail:function(a){console.log(a)}, done:function(e, a){console.log(a)}};
i.handler(event, context);
