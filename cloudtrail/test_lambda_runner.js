
var region = 'us-west-1';
//var profile = 'federated_sgas_admin';
//var bucketName = 'sgas.cto.cloudtrail';
var profile = 'default';
var accountId = '290093585298';
var bucketName = accountId + '.cloudtrail';
var trailName = 'Default';


///// checker
var i = require('./index_checker');
var event = {
  profile: profile,
  region: region,
  trailName: trailName
}
var context = {fail:function(a){console.log(a)}, done:function(e, a){console.log(a)}};
i.handler(event, context);


///// preconfig
var i = require('./index_preconfig');
var event = {
  profile: profile,
  bucketName: bucketName,
}
var context = {fail:function(a){console.log(a)}, done:function(e, a){console.log(a)}};
i.handler(event, context);


///// enabler
var i = require('./index_enabler');
var event = {
  profile: profile,
  region: region,
  trailName: trailName,
  bucketName: bucketName
}
var context = {fail:function(a){console.log(a)}, done:function(e, a){console.log(a)}};
i.handler(event, context);


///// remover
var i = require('./index_remover');
var event = {
  profile: profile,
  region: region,
  trailName: trailName,
}
var context = {fail:function(a){console.log(a)}, done:function(e, a){console.log(a)}};
i.handler(event, context);
