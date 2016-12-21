
var updator = new (require('../../lib/lambda_code_updator'))();

var environment = process.env.NODE_ENV;
var configFile = 'default';
if (environment)  configFile = environment;

var config = require('./particles-enhancesnapshot/config/' + configFile);
console.log(config.s3[0].aws.bucket);

var functionNames = ['enhance-snapshot-launcher'];

var input = {
  "region": null,
  "bucketName": null,
  "keyName": "particles/assets/enhancesnapshot.zip",
  "zipFile" : "enhancesnapshot.zip",
  "sourceFolder" : "../..",
  "src" : ["enhancesnapshot/index_*.js", "enhancesnapshot/json/*.json", "lib/flow_controller.js", "lib/aws/*.js"]
}
console.log(input);

update(0, functionNames, input);

function update(idx, functionNames, input) {
  input.functionName = functionNames[idx];
  updateFunction(0, config.s3, input, function(err, data) {
    if(err) {
      console.log("Error occurred during updating codes : " + err);
      process.exit(1);
    }
    else if(data) {
      console.log("Successfully updated codes of " + input.functionName + " in all regions");
      if (++idx < functionNames.length) {
        update(idx, functionNames, input);
      }
      else {
        process.exit(0);
      }
    }
    else {
      console.log("Failed to update codes");
      process.exit(1);
    }
  });
}

function updateFunction(idx, s3, input, cb) {
  input.region = s3[idx].aws.region;
  input.bucketName = s3[idx].aws.bucket;
  updator.update(input, function(err, data) {
    if(err) {
      console.log("Error occurred during updating codes : " + err);
      process.exit(1);
    }
    else if(data) {
      console.log("Successfully updated codes of " + input.functionName + " in region " + input.region);
      if (++idx < s3.length) {
        updateFunction(idx, s3, input, cb);
      }
      else {
        cb(null, true);
      }
    }
    else {
      console.log("Failed to update codes");
      process.exit(1);
    }
  });
}
