
# AWSConfig

AWS Lambda functions to manage the AWSConfig Service


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
