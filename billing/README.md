
# AWSConfig

AWS Lambda functions to manage the Billing Service


## How To Setup

    $ make -e AWS_REGION=<region>


## How To Update Lambda Function Codes

    $ make buildlambda


## How To Remove Service

    $ make clean -e AWS_REGION=<region>


## How To Test Lambda Functions

    $ cd test
    $ node run_lambda <function_name>
      where
        <function_name> is 'one of 'index_checker', 'index_enabler' or 'index_remover'


## Prerequisites

  - Create a billing report
    https://aws.amazon.com/blogs/aws/new-upload-aws-cost-usage-reports-to-redshift-and-quicksight/

  - Create an IAM Role that the Redshift to use to acces the report S3 bucket

  - Once the lambda stack is created, register the import lambda function into the report S3 bucket event
