
# AWSEC2

AWS Lambda functions to manage the AWS EC2


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
        <function_name> is yet to figure out
