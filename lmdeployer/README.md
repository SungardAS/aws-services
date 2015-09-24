
## Lambda Deployer

AWS Lambda functions to automatically update lambda function codes whenever they are updated in S3 buckets.


## How To Depoly & Remove Functions

  > cd build

  > edit parameter values in 'run_params.json'

  > node run_build \<action\>

    where

      <action> is one of 'deploy' and 'clean'

      <profile> is optional


## How To Test

  > cd test

  > edit parameter values in 'run_lambda.js'

  > node run_lambda [\<profile\>]

    where

      <profile> is optional
