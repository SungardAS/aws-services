
var uploader = new (require('./file_uploader'))();

function LambdaDeployer() {

  var me = this;

  function readPackage(dirName, packageJSONFileName) {

    var fs = require("fs");
    var data = fs.readFileSync(dirName + '/' + packageJSONFileName, {encoding:'utf8'});
    var packageJSON = JSON.parse(data);
    console.log(packageJSON);

    var input = {
      region: packageJSON.region,
      bucketName: packageJSON.bucketName,
      zipFile: packageJSON.zipFile,
      sourceFolder: packageJSON.sourceFolder,
      src: packageJSON.src,
      keyName: packageJSON.keyName,
    };
    console.log(input);

    return input;
  }

  me.upload = function(dirName, packageJSONFileName, assumeRoleInfoBeforeDeploy, callback) {
    var input = readPackage(dirName, packageJSONFileName);
    if (assumeRoleInfoBeforeDeploy) {
      var provider = new (require('./aws/assume_role_provider'))();
      var roles = assumeRoleInfoBeforeDeploy.roles;
      var sessionName = assumeRoleInfoBeforeDeploy.sessionName;
      var durationSeconds = assumeRoleInfoBeforeDeploy.durationSeconds;
      var profile = assumeRoleInfoBeforeDeploy.profile;
      provider.getCredential(roles, sessionName, durationSeconds, profile, function(err, data) {
        if(err) {
          console.log("failed to assume roles before deploy");
        }
        else {
          console.log("successfully assumed roles before deploy");
          input.creds = data;
          uploader.upload(input);
        }
      });
    }
    else {
      uploader.upload(input);
    }
  }
}

module.exports = LambdaDeployer
