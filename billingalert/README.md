
# Billing Alert System

AWS micro service to send a notification when the increased percentage of 'EstimatedCharges' exceeds the defined threshold.


## How To Process Initial Setup

  > set the AWS auth keys in environment variables

  > change list of 'ACCOUNTS' in 'Makefile' with the accounts whose 'EstimatedCharges' will be monitored & alerted

  > $ make


## How To Update Lambda Function Codes

  > set the AWS auth keys in environment variables

  > $ cd build.f

  > $ node run_upload_code <function_name>

  > $ node run_update_code <function_name>

    where

      <function_name> is one of 'index', 'index_saver' and 'index_populator'


## How To Test Lambda Functions

  > set the AWS auth keys in environment variables

  > $ cd test

  > $ node run_lambda <function_name>

    where

      <function_name> is one of 'index', 'index_saver' and 'index_populator'
