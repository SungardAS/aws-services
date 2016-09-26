'use strict';
console.log('Loading function');

var config = require('config');
var AWS = require('aws-sdk');
var request = require('request');
var querystring = require('querystring');
var collector = require('./instance_attr_collector');
var builder = require('./spotinst_json_builder');
var s3Bucket = require('./s3bucket');
var awsLambda = require('./lambda');

var s3 = new s3Bucket();
var lambda = new awsLambda();

var federatedCreds = null;

exports.handler = (event, context, callback) => {

  console.log('Received event:', JSON.stringify(event, null, 2));

  var federateRoleArn = event.federateRoleArn;
  var accountRoleArn = event.accountRoleArn;
  var externalId = event.externalId;
  var spotinstAccessKey = event.spotinstAccessKey;
  var instanceId = event.instanceId;
  var instanceRegion = event.instanceRegion;
  var instanceAccount = accountRoleArn.split(":")[4];

  var account = federateRoleArn.split(":")[4];
  var region = config.get('region');
  var bucketName = config.get('bucketNamePrefix') + account + '.' + region;
  var templateFilePath = config.get('templateFilePath');
  var serviceTokenFunctionName = config.get('serviceTokenFunctionName');
  // "arn:aws:lambda:us-east-1:089476987273:function:SSOProxyElastigroup-SpotinstLambdaFunction-15P3UDNPADGF4"
  var serviceTokenArn = "arn:aws:lambda:" + region + ":" + account + ":function:" + serviceTokenFunctionName;

  // first check if the target account has a permission to call the service token lambda and add a permission if it doesn't have yet
  var input = { region: region, account: account, functionName: serviceTokenFunctionName, instanceAccount: instanceAccount };
  lambda.findAccountPolicy(input).then(data => {
    console.log(data);
    if (!data) {
      input = { region:region, principal: instanceAccount, statementId: 'Id-' + instanceAccount, functionName: serviceTokenFunctionName };
      return lambda.addPermission(input).then(res => {
        console.log(res);
        return true;
      }).catch(err => {
        console.log(err);
        callback(err);
      });
    }
    else return data;
  }).then(data => {
    // federate to the target account
    return assumeRole(federateRoleArn, accountRoleArn, externalId).then(creds => {
      return creds;
    }).catch(err => {
      console.log(err);
      callback(err);
    });
  }).then(creds => {
    federatedCreds = creds;
    // get the attributes of the given instance
    return collector.getEC2InstanceAttrs(instanceId, region, creds).then(instance => {
      console.log(JSON.stringify(instance, null, 2));
      // now build the cloudformation template
      var name = instance.InstanceId + '-elastigroup';
      var description = name;
      var keyPairName = '';
      var nameTag = name;
      var cfJson = builder.buildCF(serviceTokenArn, spotinstAccessKey, instance, name, description, keyPairName, nameTag, templateFilePath);
      console.log(JSON.stringify(cfJson, null, 2));
      return cfJson;
    }).catch(err => {
      console.log(err);
      callback(err);
    });
  }).then(cfJson => {
    // find the target bucket and create it if not exists
    return s3.createBucket({ region: instanceRegion, bucketName: bucketName }).then(res => {
      console.log(res);
      return cfJson;
    }).catch(err => {
      console.log(err);
      callback(err);
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
    }).catch(err => {
      console.log(err);
      callback(err);
    });
  }).then(templateName => {
    // now generated aws cloudformation console url
    var stackName = 'Spotinst-' + templateName.replace('.cf.json', '').replace('.', '-');
    var s3Url = 'https://s3.amazonaws.com/' + bucketName + '/' + templateName;
    generatedAWSConsoleUrl(stackName, s3Url, instanceRegion, function(err, url) {
      if (err) {
        console.log(err);
        callback(err);
      }
      else {
        console.log(url);
        callback(null, {consoleUrl: url});
      }
    });
  }).catch(err => {
    console.log(err);
    callback(err);
  });
}

function assumeRole(federateRoleArn, accountRoleArn, externalId) {
  if (!federateRoleArn) return new Promise(function(resolve, reject) {
    resolve(null);
  });
  var sts = new AWS.STS({});
  var params = {
    RoleArn: federateRoleArn,
    RoleSessionName: 'session'
  };
  return sts.assumeRole(params).promise().then(function(data) {
    console.log(data);
    var creds = new AWS.Credentials({
      accessKeyId: data.Credentials.AccessKeyId,
      secretAccessKey: data.Credentials.SecretAccessKey,
      sessionToken: data.Credentials.SessionToken
    });
    sts = new AWS.STS({credentials: creds});
    params = {
      RoleArn: accountRoleArn,
      ExternalId: externalId,
      RoleSessionName: 'session'
    };
    return sts.assumeRole(params).promise().then(function(data) {
      console.log(data);
      creds = new AWS.Credentials({
        accessKeyId: data.Credentials.AccessKeyId,
        secretAccessKey: data.Credentials.SecretAccessKey,
        sessionToken: data.Credentials.SessionToken
      });
      return creds;
    }).catch(function(err){
      console.log(err);
    });
  }).catch(function(err){
    console.log(err);
  });
}

function generatedAWSConsoleUrl(stackName, s3Url, instanceRegion, cb) {
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
