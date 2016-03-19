
# Alarm Alert System

AWS micro service to send a notification whenever new alert email is detected.


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
        <function_name> is 'index_saver'
