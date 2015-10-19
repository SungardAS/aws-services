
var argv = require('minimist')(process.argv.slice(2));
var inputFile = argv._[0];
if (!inputFile) {
  console.log(inputFile);
  console.log("node run_update_code <input json file name without '.json'>");
  return;
}
console.log('input = ' + inputFile);

var fs = require("fs");
var data = fs.readFileSync(__dirname + '/' + inputFile + ".json", {encoding:'utf8'});
var input = JSON.parse(data);
console.log(input);

var updator = new (require('../../lib/lambda_code_updator'))();
updator.update(input, function(err, data) {
  if(err) {
    console.log("Error occurred during updating codes : " + JSON.stringify(err));
    process.exit(1);
  }
  else if(data) {
    console.log("Successfully updated codes");
    process.exit(0);
  }
  else {
    console.log("Failed to update codes");
    process.exit(1);
  }
});
