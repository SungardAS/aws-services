
var argv = require('minimist')(process.argv.slice(2));
var profile = argv._[0];

var i = require('../index');
var event = {
  "Records" : [
    {
      "awsRegion": "us-east-1",
      "s3": {
        "bucket": {"name": "089476987273.sgas.cto.lambda-files"},
        "object": {"key": "nodejs/awsconfig-checker.zip", "versionId": "v1"}
      }
    }
  ]
}
if (profile)  event.profile = profile;

var context = {fail:function(a){console.log(a)}, done:function(e, a){console.log(a)}};
i.handler(event, context);
