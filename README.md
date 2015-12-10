# aws-services
Micro-services to provide various conveniences in managing AWS services


## How To Setup All Services

    $ make \
      -e AWS_ACCESS_KEY_ID=<access_key> \
      -e AWS_SECRET_ACCESS_KEY=<secret_key> \
      -e AWS_SESSION_TOKEN=<session_token> \
      -e AWS_REGION=<region> \
      -e ACCOUNTS="<accounts whose billing charges will be monitored separated by spaces>"


## How To Update Lambda Function Codes of All Services

    $ make buildlambda \
      -e AWS_ACCESS_KEY_ID=<access_key> \
      -e AWS_SECRET_ACCESS_KEY=<secret_key> \
      -e AWS_SESSION_TOKEN=<session_token> \
      -e AWS_REGION=<region>


## How To Remove All Services

    $ make clean \
      -e AWS_ACCESS_KEY_ID=<access_key> \
      -e AWS_SECRET_ACCESS_KEY=<secret_key> \
      -e AWS_SESSION_TOKEN=<session_token> \
      -e AWS_REGION=<region>


# Service List

## <a href='https://github.com/SungardAS/aws-services/tree/develop/alarmalert'>alarmalert</a>
AWS micro service to send a notification whenever new alert email is detected.

## <a href='https://github.com/SungardAS/aws-services/tree/develop/awsconfig'>awsconfig</a>
AWS Lambda functions to manage the AWSConfig Service

## <a href='https://github.com/SungardAS/aws-services/tree/develop/billingalert'>billingalert</a>
AWS micro service to send a notification when the increased percentage of 'EstimatedCharges' exceeds the defined threshold.

## <a href='https://github.com/SungardAS/aws-services/tree/develop/cloudformation'>cloudformation</a>
A plugin to support static names in Lamdba funtions, lambda invoke permission in SNS topics and role federations

## <a href='https://github.com/SungardAS/aws-services/tree/develop/cloudtrail'>cloudtrail</a>
AWS Lambda functions to manage the CloudTrail Service

## <a href='https://github.com/SungardAS/aws-services/tree/develop/lib'>lib</a>
Libraries shared by projects

## <a href='https://github.com/SungardAS/aws-services/tree/develop/jenkins'>jenkins</a>
CI/CD build jenkins server of this project

## <a href='https://github.com/SungardAS/aws-services/tree/develop/sns-message-validator'>sns-message-validator</a>
Utility to validate the sns messages that are received through the HTTP subscriptions.
This is the Node.js implementation of the instructions here, http://docs.aws.amazon.com/sns/latest/dg/SendMessageToHttp.verify.signature.html.
