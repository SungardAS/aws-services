
# Alarm Alert System

AWS micro service to send a notification whenever new alert email is detected.


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

      <function_name> is 'index_saver'
