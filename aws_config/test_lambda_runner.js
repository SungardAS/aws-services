
var region = 'us-east-1';
//var profile = 'federated_sgas_admin';
var profile = 'default';
var accountId = '290093585298';
var bucketName = accountId + '.aws_config';
var topicName = 'aws-config-topic';
var roleName = 'aws-config-setup-role';
var assumeRolePolicyName = 'aws_config_assume_role_policy';
var inlinePolicyName = 'aws_config_setup_policy';
var deliveryChannelName = 'default';
var configRecorderName = 'default';


///// checker
var i = require('./index_checker');
var event = {
  profile: profile,
  region: region
}
var context = {fail:function(a){console.log(a)}, done:function(e, a){console.log(a)}};
i.handler(event, context);


///// preconfig
var i = require('./index_preconfig');
var event = {
  profile: profile,
  bucketName : bucketName,
  roleName : roleName,
  assumeRolePolicyName: assumeRolePolicyName,
  inlinePolicyName : inlinePolicyName,
}
var context = {fail:function(a){console.log(a)}, done:function(e, a){console.log(a)}};
i.handler(event, context);


///// enabler
var i = require('./index_enabler');
var event = {
  profile: profile,
  region : region,
  bucketName : bucketName,
  topicName: topicName,
  roleName : roleName,
  inlinePolicyName : inlinePolicyName,
  deliveryChannelName : deliveryChannelName,
  configRecorderName : configRecorderName
}
var context = {fail:function(a){console.log(a)}, done:function(e, a){console.log(a)}};
i.handler(event, context);


///// remover
var i = require('./index_remover');
var event = {
  region : region_name,
  bucketName : bucketName,
  topicName : topicName
}
var context = {fail:function(a){console.log(a)}, done:function(e, a){console.log(a)}};
i.handler(event, context);
