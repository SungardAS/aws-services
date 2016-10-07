'use strict';
console.log('Loading function');

var auth = require('./lib/authorizer');

exports.handler = (event, context) => {

  console.log('Received event:', JSON.stringify(event, null, 2));
  /*{
      "resource": "/{proxy+}",
      "path": "/auth",
      "httpMethod": "POST",
      "headers": {
          "external-id":
          " 1234"
      },
      "queryStringParameters": {
          "a": "1",
          "b": "2"
      },
      "pathParameters": { "proxy": "auth" },
      "stageVariables": null,
      "requestContext": {
          "accountId": "089476987273",
          "resourceId": "85hu0a",
          "stage": "test-invoke-stage",
          "requestId": "test-invoke-request",
          "identity": {
              "cognitoIdentityPoolId": null,
              "accountId": null,
              "cognitoIdentityId": null,
              "caller": null,
              "apiKey": null,
              "sourceIp": "108.248.87.133",
              "cognitoAuthenticationType": null,
              "cognitoAuthenticationProvider": null,
              "userArn": null,
              "userAgent": "Apache-HttpClient/4.5.x (Java/1.8.0_102)",
              "user": null
          },
          "resourcePath": "/{proxy+}",
          "httpMethod": "POST",
          "apiId": "obkuecl0oh"
      },
      "body": "{\n    \"a\":\"a\"\n}"
  }*/

  var method = event.httpMethod;
  var path = event.path;
  var headers = event.headers;
  var queryParams = event.queryStringParameters;
  var postData = (event.body) ? JSON.parse(event.body) : null;

  if (path == '/auth' && method == 'POST') {
    auth.authenticate(postData.username, postData.password).then(data => {
      console.log(data);
      var ret = JSON.parse(data);
      if (!ret.refresh_token) {
        sendFailureResponse({error: 'unauthorized'}, 401, context);
      }
      else {
        sendSuccessResponse(ret, context);
      }
    }).catch(err => {
      console.log(err);
      sendFailureResponse({error: 'unauthorized'}, 401, context);
    });
    return;
  }

  // authorize first
  auth.authorize(headers.refresh_token).then(data => {
    /*console.log(data);
    var ret = JSON.parse(data);
    if (!ret.refresh_token) {
      sendFailureResponse({error: 'not permitted'}, 403, context);
    }
    return ret.refresh_token;*/
    return '';
  }).then(refreshToken => {

    // now find the target controller
    method = method.toLowerCase();
    path = path.substring(1);
    var params = null;
    if (method == 'get') {
      params = queryParams;
    }
    else {
      params = postData;
    }
    var controller = require('./' + path + '_controller');
    console.log("controller: " + controller);

    // now check if the method exists in the found controller
    if (!(method in controller)) {
      sendNotPermittedMethodResponse(path, method, context);
      return;
    }

    // run the method
    controller[method](params).then(data => {
      console.log(data);
      sendSuccessResponse(data, context);
    }).catch(err => {
      console.log(err);
      sendFailureResponse({error: err}, 500, context);
    });

  }).catch(err => {
    console.log(err);
    sendFailureResponse({error: 'not permitted'}, 403, context);
  });
}

function sendNotPermittedMethodResponse(path, method, context) {
  var responseBody = {error: "not permitted method " + method + " in " + path};
  var statusCode = 404;
  sendResponse(responseBody, statusCode, context);
}

function sendNotFoundResponse(path, method, context) {
  var responseBody = {error: "invalid path " + path};
  var statusCode = 404;
  sendResponse(responseBody, statusCode, context);
}

function sendSuccessResponse(retValue, context) {
  var responseBody = retValue;
  var statusCode = 200;
  sendResponse(responseBody, statusCode, context);
}

function sendFailureResponse(err, statusCode, context) {
  var responseBody = err;
  sendResponse(responseBody, statusCode, context);
}

function sendResponse(responseBody, statusCode, context) {
  var response = {
      statusCode: statusCode,
      body: JSON.stringify(responseBody)
  };
  console.log("response: " + JSON.stringify(response))
  context.succeed(response);
}
