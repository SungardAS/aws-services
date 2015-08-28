
var region = 'us-east-1';
var profile = 'default';
var account = '290093585298';


///// cron
var i = require('./index_cron');
var event = {
  profile: profile,
  region: region
}
var context = {fail:function(a){console.log(a)}, done:function(e, a){console.log(a)}};
i.handler(event, context);


///// eventlog
var i = require('./index_eventlog');
var event = {
  profile: profile,
  region: region
}
var context = {fail:function(a){console.log(a)}, done:function(e, a){console.log(a)}};
i.handler(event, context);
