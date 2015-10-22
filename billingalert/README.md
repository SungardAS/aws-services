
# Billing Alert System

AWS micro service to send a notification when the increased percentage of 'EstimatedCharges' exceeds the defined threshold.


## How To Setup

    > change list of 'ACCOUNTS' in 'Makefile' with the accounts whose 'EstimatedCharges' will be monitored & alerted
    $ make -e AWS_REGION=<region>
      or
    $ export AWS_REGION=<region>
    $ make


## How To Update Lambda Function Codes

    $ make buildlambda -e AWS_REGION=<region>
      or
    $ export AWS_REGION=<region>
    $ make buildlambda


## How To Remove Service

    $ make clean -e AWS_REGION=<region>
      or
    $ export AWS_REGION=<region>
    $ make clean


## How To Test Lambda Functions

    $ cd test
    $ node run_lambda <function_name>
      where
        <function_name> is one of 'index', 'index_saver' and 'index_populator'
