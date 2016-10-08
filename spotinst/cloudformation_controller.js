
var config = require('config');
var request = require('request');
var querystring = require('querystring');
var Q = require("q");

var collector = require('./lib/instance_attr_collector');
var builder = require('./lib/spotinst_json_builder');
var sts = require('./lib/sts');
var s3 = require('./lib/s3bucket');
var lambda = require('./lib/lambda');

var federatedCreds = null;

module.exports = {

  post: function(params) {

    var federateRoleArn = params.federateRoleArn;
    var accountRoleArn = params.accountRoleArn;
    var externalId = params.externalId;
    var spotinstAccessKey = params.spotinstAccessKey;
    var instanceId = params.instanceId;
    var instanceRegion = params.instanceRegion;

    var region = config.get('region');
    var bucketPrefix = config.get('bucketNamePrefix');
    var templateFilePath = config.get('templateFilePath');
    var serviceTokenFunctionName = config.get('serviceTokenFunctionName');

    var instanceAccount = accountRoleArn.split(":")[4];
    var account = federateRoleArn.split(":")[4];
    var bucketName = bucketPrefix + account + '.' + region;
    // "arn:aws:lambda:us-east-1:089476987273:function:SSOProxyElastigroup-SpotinstLambdaFunction-15P3UDNPADGF4"
    var serviceTokenArn = "arn:aws:lambda:" + region + ":" + account + ":function:" + serviceTokenFunctionName;

    // first check if the target account has a permission to call the service token lambda and add a permission if it doesn't have yet
    var input = { region: region, account: account, functionName: serviceTokenFunctionName, instanceAccount: instanceAccount };
    return lambda.findAccountPolicy(input).then(data => {
      console.log(data);
      if (!data) {
        input = { region:region, principal: instanceAccount, statementId: 'Id-' + instanceAccount, functionName: serviceTokenFunctionName };
        return lambda.addPermission(input).then(res => {
          console.log(res);
          return true;
        });
      }
      else return data;
    }).then(data => {
      // federate to the target account
      return sts.assumeRole(federateRoleArn, accountRoleArn, externalId).then(creds => {
        return creds;
      });
    }).then(creds => {
      federatedCreds = creds;
      // get the attributes of the given instance
      return collector.getEC2InstanceAttrs(instanceId, instanceRegion, creds).then(instance => {
        console.log(JSON.stringify(instance, null, 2));
        // now build the cloudformation template
        var name = instance.InstanceId + '-elastigroup';
        var description = name;
        var keyPairName = '';
        var nameTag = name;
        var cfJson = builder.buildCF(serviceTokenArn, spotinstAccessKey, instance, name, description, keyPairName, nameTag, templateFilePath);
        console.log(JSON.stringify(cfJson, null, 2));
        return cfJson;
      });
    }).then(cfJson => {
      // find the target bucket and create it if not exists
      return s3.createBucket({ region: instanceRegion, bucketName: bucketName }).then(res => {
        console.log(res);
        return cfJson;
      });
    }).then(cfJson => {
      // upload the generated cloudformation template in s3 bucket
      var templateName = instanceAccount + '.' + cfJson.Parameters.ElastiGroupName.Default.replace(/ /g, '-') + '.cf.json';
      var params = {
        region: instanceRegion,
        acl: 'public-read',
        bucketName: bucketName,
        keyName: templateName,
        data: JSON.stringify(cfJson),
      };
      return s3.putObject(params).then(res => {
        return templateName;
      });
    }).then(templateName => {
      // now generated aws cloudformation console url
      var stackName = 'Spotinst-' + templateName.replace('.cf.json', '').replace('.', '-');
      var s3Url = 'https://s3.amazonaws.com/' + bucketName + '/' + templateName;
      var deferred = Q.defer();
      this.generatedAWSConsoleUrl(stackName, s3Url, instanceRegion, function(err, url) {
        if (err) {
          deferred.reject(new Error(err));
        }
        else {
          console.log(url);
          deferred.resolve({consoleUrl: url});
        }
      });
      return deferred.promise;
    });
  },

  generatedAWSConsoleUrl: function(stackName, s3Url, instanceRegion, cb) {
    var sessString = JSON.stringify({
      sessionId: federatedCreds.accessKeyId,
      sessionKey: federatedCreds.secretAccessKey,
      sessionToken: federatedCreds.sessionToken
    });
    var getTokenQuery = {
      Action: 'getSigninToken',
      Session: sessString
    };
    request.get(
      'https://signin.aws.amazon.com/federation?'+querystring.stringify(getTokenQuery),
      function(err,res,body) {
        var token = JSON.parse(body);
        var loginQuery = {
          Action: 'login',
          Destination: "https://console.aws.amazon.com/cloudformation/home?region=" + instanceRegion + "#/stacks/new?stackName=" + stackName + "&templateURL=" + s3Url,
          SigninToken: token.SigninToken
        };
        //if (options.Issuer) {
        //  loginQuery.Issuer = options.Issuer
        //}
        var url = "https://signin.aws.amazon.com/federation?" + querystring.stringify(loginQuery);
        //console.log(url);
        cb(err, url);
      }
    );
  }
}
