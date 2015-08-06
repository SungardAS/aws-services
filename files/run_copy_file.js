
var argv = require('minimist')(process.argv.slice(2));

var Zipper = require('../lib/zipper');
var zipper = new Zipper();
var AWSS3Bucket = require('../lib/s3bucket.js');
var aws_bucket = new AWSS3Bucket();

var profile = process.env.aws_profile;
var account = process.env.aws_account;
var bucketName = account + '.sgas.cto.lambda-files';
var sourceFolder = '/Users/alex.ough/Projects/Node/aws-services';
var src = ['awsconfig/**/*', 'cloudtrail/**/*', 'lib/**/*', 'billing_notifier/**/*'];
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
  {func:aws_bucket.findBucket, success:zipper.zip, failure:aws_bucket.createBucket},
  {func:aws_bucket.createBucket, success:zipper.zip},
  {func:zipper.zip, success:aws_bucket.putObject},
  {func:aws_bucket.putObject},
]
input.functionChain = functionChain;
functionChain[0].func(input);
