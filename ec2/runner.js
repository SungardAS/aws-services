
var collector = require('./instance_attr_collector');
var builder = require('./spotinst_json_builder');

var instanceId = 'i-a5f7153c';  // dev-api
//var instanceId = 'i-9fc5200c';  // SSO-proxy
//var instanceId = 'i-da621e59';  // mail server
//var instanceId = 'i-79dea6e4';  // db accessor

var instances = [
  {
    instanceId: 'i-a5f7153c', // dev-api
    name: 'dev-api-elastigroup',
    description: 'ElastiGroup of dev-api',
    tags: [ { Key:'Name', Value:'dev-api-spotinst' } ],
    keyPairName: 'alex-us-east-1-key'
  },
  {
    instanceId: 'i-9fc5200c', // SSO-proxy
    name: 'SSO-proxy-elastigroup',
    description: 'ElastiGroup of SSO-proxy',
    tags: [ { Key:'Name', Value:'SSO-proxy-spotinst' } ],
    keyPairName: 'alex-us-east-1-key'
  },
  {
    instanceId: 'i-da621e59', // mail server
    name: 'mail-server-elastigroup',
    description: 'ElastiGroup of mail-server',
    tags: [ { Key:'Name', Value:'mail-server-spotinst' } ],
    keyPairName: 'alex-us-east-1-key'
  },
  {
    instanceId: 'i-79dea6e4', // db accessor
    name: 'db-accessor-elastigroup',
    description: 'ElastiGroup of db-accessor',
    tags: [ { Key:'Name', Value:'db-accessor-spotinst' } ],
    keyPairName: 'alex-us-east-1-key'
  }
]

var idx = 3;
collector.getEC2InstanceAttrs(instances[idx].instanceId).then(function(instance) {
  console.log(JSON.stringify(instance, null, '  '));
  var json = builder.buildSpotinstJSON(instance, instances[idx].name, instances[idx].description, instances[idx].keyPairName, instances[idx].tags);
  console.log(JSON.stringify(json, null, '  '));
});


// curl -X POST -H "Content-Type: application/json" -H "Authorization: Bearer d04821bde138802e17d3b4cbda1283b2193f79e419341bfb3b51073d9187185f" -d @json/i-79dea6e4-dbaccessor.json https://api.spotinst.io/aws/ec2/group
