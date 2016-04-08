
var uploader = new (require('../../lib/file_uploader'))();

var environment = process.env.NODE_ENV;
var configFile = 'default';
if (environment)  configFile = environment;

var config = require('./particles-alarmalert/config/' + configFile);
console.log(config.s3[0].aws.bucket);

var input = {
  "region": null,
  "bucketName": null,
  "keyName": "particles/assets/alarmalert.zip",
  "zipFile" : "alarmalert.zip",
  "sourceFolder" : "../..",
  "src" : ['alarmalert/index_saver.js', 'alarmalert/config/*', 'lib/flow_controller.js', 'lib/aws/*.js', 'lib/google/**/*']
}
console.log(input);

upload(0, config.s3, input);

function upload(idx, s3, input) {
  input.region = s3[idx].aws.region;
  input.bucketName = s3[idx].aws.bucket;
  uploader.upload(input, function(err, data) {
    if(err) {
      console.log("Error occurred during uploading codes : " + err);
      process.exit(1);
    }
    else if(data) {
      console.log("Successfully uploaded codes in region " + input.region);
      if (++idx < s3.length) {
        upload(idx, s3, input);
      }
      else {
        process.exit(0);
      }
    }
    else {
      console.log("Failed to upload codes");
      process.exit(1);
    }
  });
}
