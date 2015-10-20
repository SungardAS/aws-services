
var argv = require('minimist')(process.argv.slice(2));
var action = argv._[0];
var region = argv['region'];
var name = argv['name'];
var parameters = argv['parameters'];
var particles = argv['particles'];
if (!region || !action || (action != 'launch' && action != 'drop') || !name) {
  console.log("Usage : node run_stack launch/drop --region <region> --name <stack name> [--parameters <parameter json str>] [--particles <particles folder name without 'particles-'>]");
  return;
}
console.log('action = ' + action);
console.log('region = ' + region);
console.log('name = ' + name);
console.log('parameters = ' + parameters);
console.log('particles Folder = ' + particles);

var templateStr = null;
if (particles) {
  var fs = require("fs");
  templateStr = fs.readFileSync(__dirname + '/particles-' + particles + "/dist/0/particles/cftemplates/template.json", {encoding:'utf8'});
}
var input = {
  region: region,
  stackName: name,
  parameters: (parameters) ? JSON.parse(parameters) : null,
  templateStr: templateStr
}
console.log(input);

var stack_builder = new (require('../../lib/stack_builder'))();
stack_builder[action](input, function(err, data) {
  if(err) {
    if (action == 'launch') {
      console.log("Error occurred during " + action + " : " + err);
      process.exit(1);
    }
    else if (action == 'drop') {
      console.log("stack was already removed");
      process.exit(0);
    }
  }
  else if(data) {
    console.log("Successfully completed to " + action + " stack");
    process.exit(0);
  }
  else {
    console.log("Failed to " + action + " stack");
    process.exit(1);
  }
});
