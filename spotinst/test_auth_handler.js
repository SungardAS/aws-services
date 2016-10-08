
var i = require('./handler.js');
var body = {
  "username": "alex.ough@sungardas.com",
  "password": "Sungard01"
};
var event = {
    "resource": "/{proxy+}",
    "path": "/spotinst/auth",
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
    "body": JSON.stringify(body)
}
var context = {succeed: res => console.log(res)};
i.handler(event, context, function(err, data) {
  if (err)  console.log(err);
  console.log("successfully completed");
  console.log(JSON.stringify(data, null, 2));
});
