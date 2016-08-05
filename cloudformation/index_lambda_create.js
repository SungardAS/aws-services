
exports.handler = function(event, context) {

  console.log("REQUEST RECEIVED:\n" + JSON.stringify(event));
  console.log("context:\n" + JSON.stringify(context));

  var responseStatus = "FAILED";
  var responseData = {};
  var keyName = "particles/assets/",
      srcZip = "awsconfigrules.zip";

  //create a security group lambda role in customer account
  var roleArn = "";
  var packageJSON = {
      policyDocument: "{'Statement': [{'Resource': '*','Action': ['config:Put*','config:Get*','config:List*','config:Describe*','ec2:Describe*','logs:CreateLogGroup','logs:CreateLogStream','logs:PutLogEvents'],'Effect': 'Allow'}],'Version': '2012-10-17'}",
      policyName: "root",
      description: "'Grant access to the security group checker lambda function to get rule details of a customer account security groups'",
      assumeRolePolicyDocument: '{"Version": "2012-10-17","Statement": [{"Effect": "Allow","Principal": {"Service": ["lambda.amazonaws.com"]},"Action": ["sts:AssumeRole"]}]}',
      roleName: "SecurityGroupLambda"
  };
  var role = new (require('./lambda_role'))();
  role.build('create', packageJSON, function(err, data) {
      if (err) {
          console.log(err);
          sendResponse(event, context, responseStatus, responseData);
      }
      else {
          console.log(data);
          responseStatus = "SUCCESS";
          responseData.Name = packageJSON.roleName;
          responseData.Arn = data;
          roleArn = data;
          sendResponse(event, context, responseStatus, responseData);
      }
  });


  // create a lambda function to get details of security group in customer account
  var packageJSON = {
      functionName: "awsconfigrules-security-group-checker",
      handler: "awsconfigrules/index_security_group_checker.handler",
      runtime: "nodejs4.3",
      timeout: "60",
      memorySize: "128",
      roleArn: roleArn,
      bucketName: event.bucketName,
      keyName: keyName + srcZip
  };

  var deployer = new (require('./lambda_deployer'))();
  deployer.build('deploy', packageJSON, function(err, data) {
    if (err) {
      console.log(err);
      sendResponse(event, context, responseStatus, responseData);
    }
    else {
      console.log(data);
      responseStatus = "SUCCESS";
      responseData.Name = packageJSON.functionName;
      responseData.Arn = data;
      sendResponse(event, context, responseStatus, responseData);
    }
  });
};

// Send response to the pre-signed S3 URL
function sendResponse(event, context, responseStatus, responseData) {

    var responseBody = JSON.stringify({
        Status: responseStatus,
        Reason: "See the details in CloudWatch Log Stream: " + context.logStreamName,
        PhysicalResourceId: context.logStreamName,
        StackId: event.StackId,
        RequestId: event.RequestId,
        LogicalResourceId: event.LogicalResourceId,
        Data: responseData
    });

    console.log("RESPONSE BODY:\n", responseBody);

    var https = require("https");
    var url = require("url");

    var parsedUrl = url.parse(event.ResponseURL);
    var options = {
        hostname: parsedUrl.hostname,
        port: 443,
        path: parsedUrl.path,
        method: "PUT",
        headers: {
            "content-type": "",
            "content-length": responseBody.length
        }
    };

    console.log("SENDING RESPONSE...\n");

    var request = https.request(options, function(response) {
        console.log("STATUS: " + response.statusCode);
        console.log("HEADERS: " + JSON.stringify(response.headers));
        // Tell AWS Lambda that the function execution is done
        context.done();
    });

    request.on("error", function(error) {
        console.log("sendResponse Error:" + error);
        // Tell AWS Lambda that the function execution is done
        context.done();
    });

    // write data to request body
    request.write(responseBody);
    request.end();
}
