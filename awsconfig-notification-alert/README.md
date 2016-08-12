
# Config  Alert System

AWS micro service to send a notification when the config policy violation.


## How To Setup

    $ make \
      -e AWS_REGION=<region> \
      -e ACCOUNTS="<accounts whose billing charges will be monitored separated by spaces>"


## How To Update Lambda Function Codes

    $ make buildlambda


## How To Remove Service

    $ make clean -e AWS_REGION=<region>


## How To Test Lambda Functions

    $ cd test
    $ node run_lambda <function_name>
      where
        <function_name> is one of 'index', 'index_saver' and 'index_populator'
