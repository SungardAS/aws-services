
var argv = require('minimist')(process.argv.slice(2));
var credentialfilePath = argv._[0];
if (!credentialfilePath) {
  console.log("node token <credential file path>");
  return;
}
console.log('credentialfilePath = ' + credentialfilePath);

var fs = require('fs');
var readline = require('readline');
var google = require('googleapis');
var googleAuth = require('google-auth-library');

var SCOPES = ['https://mail.google.com/'];

var credentials = JSON.parse(fs.readFileSync(credentialfilePath));
var clientSecret = credentials.installed.client_secret;
var clientId = credentials.installed.client_id;
var redirectUrl = credentials.installed.redirect_uris[0];
var auth = new googleAuth();
var oauth2Client = new auth.OAuth2(clientId, clientSecret, redirectUrl);

var authUrl = oauth2Client.generateAuthUrl({
  access_type: 'offline',
  scope: SCOPES
});
console.log('Authorize this app by visiting this url: ', authUrl);
var rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});
rl.question('Enter the code from that page here: ', function(code) {
  rl.close();
  oauth2Client.getToken(code, function(err, token) {
    if (err) {
      console.log('Error while trying to retrieve access token', err);
    }
    console.log(token);
  });
});
