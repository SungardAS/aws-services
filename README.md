# aws-services

Micro-services to provide various conveniences in managing AWS services

![aws-services][aws-services-image]

## How To Setup All Services

    $ make \
      -e AWS_REGION=<region> \
      -e ACCOUNTS="<accounts whose billing charges will be monitored separated by spaces>"


## How To Update Lambda Function Codes of All Services

    $ make buildlambda


## How To Remove All Services

    $ make clean -e AWS_REGION=<region>


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

## <a href='https://github.com/SungardAS/aws-services/tree/develop/managed-elb'>managed elb</a>
Manage Internet Facing and Internal ELB in AWS VPCs

## <a href='https://github.com/SungardAS/aws-services/tree/develop/managed-os'>managed os</a>
Provision and Manage AWS EC2 Instances

## <a href='https://github.com/SungardAS/aws-services/tree/develop/managed-volume'>managed volume</a>
Provision and Manage AWS EBS Volumes

## <a href='https://github.com/SungardAS/aws-services/tree/develop/managed-vpc'>managed vpc</a>
Provision and Manage  AWS VPC's with all its contained resources

## <a href='https://github.com/SungardAS/aws-services/tree/develop/sns-message-validator'>sns-message-validator</a>
Utility to validate the sns messages that are received through the HTTP subscriptions.
This is the Node.js implementation of the instructions here, http://docs.aws.amazon.com/sns/latest/dg/SendMessageToHttp.verify.signature.html.

## <a href='https://github.com/SungardAS/aws-services/tree/develop/volume'>volume</a>
A Lambda function to tag untagged volumes.

## [![Sungard Availability Services | Labs][labs-logo]][labs-github-url]

This project is maintained by the Labs group at [Sungard Availability
Services](http://sungardas.com)

GitHub: [https://sungardas.github.io](https://sungardas.github.io)

Blog:
[http://blog.sungardas.com/CTOLabs/](http://blog.sungardas.com/CTOLabs/)

[labs-github-url]: https://sungardas.github.io
[labs-logo]: https://raw.githubusercontent.com/SungardAS/repo-assets/master/images/logos/sungardas-labs-logo-small.png
[aws-services-image]: ./docs/images/logo.png?raw=true
