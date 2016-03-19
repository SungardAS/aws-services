
# Cloudformation Plugin For Custom Resources

A plugin to support

  - static names in Lamdba funtions
  - lambda invoke permission in SNS topics
  - role federations


## How To Test Lambda Functions

    $ cd test
    $ node run_lambda <function_name>
      where
        <function_name> is one of 'index', 'index_iam_federation' and 'index_lambda_permission'
