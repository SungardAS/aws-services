
# AWSFederation

AWS Lambda function to manage the Federation


## How To Setup

    $ make -e AWS_REGION=<region> ENV=<dev|qa|staging|prod> | ROLE=<roleName>
    
    For example:
     $ make -e AWS_REGION=us-east-1 ENV=dev
     
     $ make -e AWS_REGION=us-east-1 ROLE="SungardAS-aws-services-feder-LambdaFunctionIAMRole-1TJ0PPEOJSUL8"
     
     $ make -e AWS_REGION=us-east-1 ENV=dev ROLE="SungardAS-aws-services-feder-LambdaFunctionIAMRole-1TJ0PPEOJSUL8"


## How To Update Lambda Function Codes

    $ make buildlambda


## How To Remove Service

    $ make clean -e AWS_REGION=<region>


## How To Test Lambda Functions

    $ cd test
    $ node run_lambda <function_name>
      where
        <function_name> is 'index'
