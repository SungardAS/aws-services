
# Volume

This is Lambda functions to
  - provide the list of EC2 instances with lower usages
  - generate a cloudformation template that build a Spotinst elastigroup of a certain EC2 instance
  - build a Spotinst elastigroup of a certain EC2 instance


## Manual steps before deployment

   1. Run 'npm run dist' in 'spotinst-lambda' project to build a 'spotinst-lambda.zip' file under 'dir' folder

## How To Setup

   1. build the cloudformation template using the condensation particles

   2. create a stack through the AWS Cloudformation console with these parameter values


## How To Update Lambda Function Codes

   $ make buildlambda
