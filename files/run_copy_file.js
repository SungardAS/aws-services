
var Zipper = require('../lib/zipper');
var zipper = new Zipper();
var AWSS3Bucket = require('../lib/s3bucket.js');
var aws_bucket = new AWSS3Bucket();

var profile = 'default';
//var profile = 'federated_sgas_admin';
var accountId = '290093585298';
var bucketName = accountId + '.sgas.cto.lambda-files';
var sourceFolder = '/Users/alex.ough/Projects/Node/aws-services';
var src = ['aws_config/**/*', 'cloudtrail/**/*', 'lib/**/*', 'billing_notifier/**/*'];
var fileName = 'aws_services.zip';

input = {
  profile : profile,
  bucketName: bucketName,
  keyName: 'nodejs/' + fileName,
  zipFile : fileName,
  sourceFolder : sourceFolder,
  src : src
};

var functionChain = [
  {func:aws_bucket.findBucket, success:zipper.zip},
  {func:zipper.zip, success:aws_bucket.putObject},
  {func:aws_bucket.putObject},
]
input.functionChain = functionChain;
functionChain[0].func(input);
