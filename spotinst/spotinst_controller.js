
var sts = require('../lib/aws_promise/sts');
var collector = require('./lib/instance_attr_collector');
var builder = require('./lib/spotinst_json_builder');

module.exports = {

  post: function(params) {

    var federateRoleArn = params.federateRoleArn;
    var accountRoleArn = params.accountRoleArn;
    var externalId = params.externalId;
    var accessKey = params.spotinstAccessKey;

    var input = {
      federateRoleArn: federateRoleArn,
      accountRoleArn: accountRoleArn,
      externalId: externalId
    }
    return sts.assumeRole(input).then(function(creds) {
      return collector.getEC2InstanceAttrs(params.instanceId, params.instanceRegion, creds).then(function(instance) {
        console.log(JSON.stringify(instance, null, 2));
        var json = builder.build(instance, params.name, params.description, params.keyPairName, JSON.parse(params.tags));
        console.log(JSON.stringify(json, null, 2));
        if (params.dryRun) {
          return json;
        }
        else {
          return builder.deploy(json, accessKey).then(function(data) {
            console.log("Spotinst was successfully deployed : " + data);
            return data;
          });
        }
      });
    });
  }
}
