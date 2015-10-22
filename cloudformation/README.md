
# Cloudformation Plugin For Custom Resources

A plugin to support

  - static names in Lamdba funtions

  - lambda invoke permission in SNS topics

  - role federations


## How To Setup

    > set the AWS auth keys in environment variables
    $ make


## How To Update Lambda Function Codes

    > set the AWS auth keys in environment variables
    $ make buildlambda


## How To Test Lambda Functions

    > set the AWS auth keys in environment variables
    $ cd test
    $ node run_lambda \<function_name\>
      where
        <function_name> is one of 'index', 'index_iam_federation' and 'index_lambda_permission'
