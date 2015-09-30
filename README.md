# aws-services
Micro-services to provide various conveniences in managing AWS services

## alarmalert
AWS micro service to send a notification whenever new alert email is detected.

## awsconfig
AWS Lambda functions to manage the AWSConfig Service

## billingalert
AWS micro service to send a notification when the increased percentage of 'EstimatedCharges' exceeds the defined threshold.

## cloudtrail
AWS Lambda functions to manage the CloudTrail Service

## lib
Libraries shared by projects

## lmdeployer
AWS Lambda function to automatically update lambda function codes whenever they are updated in S3 buckets.

## sns-message-validator
Utility to validate the sns messages that are received through the HTTP subscriptions.
This is the Node.js implementation of the instructions here, http://docs.aws.amazon.com/sns/latest/dg/SendMessageToHttp.verify.signature.html.
