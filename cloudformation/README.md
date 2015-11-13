
# Cloudformation Plugin For Custom Resources

A plugin to support

  - static names in Lamdba funtions
  - lambda invoke permission in SNS topics
  - role federations


## How To Setup

    $ make -e AWS_REGION=<region>
      or
    $ export AWS_REGION=<region>
    $ make


## How To Update Lambda Function Codes

    $ make buildlambda -e AWS_REGION=<region>
      or
    $ export AWS_REGION=<region>
    $ make buildlambda


## How To Test Lambda Functions

    $ cd test
    $ node run_lambda <function_name>
      where
        <function_name> is one of 'index', 'index_iam_federation' and 'index_lambda_permission'
