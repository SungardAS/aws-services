'use strict';

const AWS = require('aws-sdk');

function sendResponse(responseBody, statusCode, context) {
  if (statusCode == 200) {
    context.succeed(responseBody);
  }
  else {
    context.fail(responseBody);
  }
}

exports.handler = (event, context) => {

  console.log(event);

  var refresh_token = event.authorizer_refresh_token;
  var user_guid = event.authorizer_user_guid;
  console.log('user_guid = ' + user_guid);
  var error = event.authorizer_error;
  if (error) {
      sendResponse(error, 403, context);
  }

  assumeRole(null, 0, event.roles, user_guid, event.durationSeconds, function(err, data) {
    if (err)  sendResponse(err, 500, context);
    else {
      if (event.region) data['region'] = event.region;
      //if (refresh_token) data['refresh_token'] = refresh_token;
      sendResponse(data, 200, context);
    }
  });
}

const assumeRole = (creds, idx, roles, sessionName, durationSeconds, callback) => {
  var params = {};
  let role = roles[idx];
  if (creds)  params.credentials = creds;
  let sts = new AWS.STS(params);
  params = {
    RoleArn: role.roleArn,
    RoleSessionName: sessionName,
  }
  if (durationSeconds > 0)  params.DurationSeconds = durationSeconds;
  if (role.externalId)  params.ExternalId = role.externalId;
  sts.assumeRole(params, function(err, data) {
    if (err) {
      console.log(err, err.stack);
      callback(err, null);
    }
    else {
      console.log("successfully assumed role, '" + role.roleArn + "'");
      //console.log(data);
      if (++idx == roles.length) {
        console.log("successfully completed to assume all roles");
        /*creds = new AWS.Credentials({
          accessKeyId: data.Credentials.AccessKeyId,
          secretAccessKey: data.Credentials.SecretAccessKey,
          sessionToken: data.Credentials.SessionToken
        });
        callback(null, creds);*/
        callback(null, data);
      }
      else {
        creds = new AWS.Credentials({
          accessKeyId: data.Credentials.AccessKeyId,
          secretAccessKey: data.Credentials.SecretAccessKey,
          sessionToken: data.Credentials.SessionToken
        });
        assumeRole(creds, idx, roles, sessionName, durationSeconds, callback);
      }
    }
  });
}

