
var profile = 'aws_876224653878';
var region = "us-east-1";
var bucketName = '876224653878.sgas.cto.lambda-files';
var keyName = 'nodejs/cto_cron_runner.zip';
var versionId = 'v1';

var i = require('../index');
var event = {
  profile: profile,
  Records : [
    {
      awsRegion: region,
      s3: {
        bucket: {name: bucketName},
        object: {key: keyName, versionId: versionId}
      }
    }
  ]
}
var context = {fail:function(a){console.log(a)}, done:function(e, a){console.log(a)}};
i.handler(event, context);
