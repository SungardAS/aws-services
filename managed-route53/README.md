
# Route53

AWS micro service to Manage AWS Route53.


## How To Setup

    $ make \
      -e AWS_REGION=<region> \
      -e ACCOUNTS="<accounts whose config policy will be monitored separated by spaces>"


## How To Update Lambda Function Codes

    $ make buildlambda


## How To Remove Service

    $ make clean -e AWS_REGION=<region>


