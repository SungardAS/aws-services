
## AWSConfig

AWS Lambda functions to manage the AWSConfig Service


## How To Setup

  > set the AWS auth keys in environment variables

  > $ make


## How To Update Lambda Function Codes

  > set the AWS auth keys in environment variables

  > $ make buildlambda


## How To Remove Service

  > set the AWS auth keys in environment variables

  > $ make clean


## How To Test Lambda Functions

  > set the AWS auth keys in environment variables

  > $ cd test

  > $ node run_lambda \<function_name\>

    where

      <function_name> is 'one of 'index_checker', 'index_enabler' or 'index_remover'
