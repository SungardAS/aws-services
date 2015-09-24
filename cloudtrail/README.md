
## CloudTrail

AWS Lambda functions to manage the CloudTrail Service


### How To Depoly & Remove Functions

  > cd build

  > edit parameter values in 'run_params.json'

  > node run_build \<action\> \<module\> [\<profile\>]

    where

      <action> is one of 'deploy' and 'clean'

      <module> is one of 'checker', 'enabler' and 'remover'

      <profile> is optional


## How To Test

  > cd test

  > edit parameter values in 'run_lambda.js'

  > node run_lambda \<module\> [\<profile\>]

    where

      <module> is one of 'checker', 'enabler' and 'remover'

      <profile> is optional
