
## Alarm Alert System

AWS micro service to send a notification whenever new alert email is detected.


## How To Depoly & Remove System

  > cd build

  > create a stack using 'alarm_alert.cfn'

  > edit parameter values in 'run_params.json'

  > node run_build \<action\> [\<profile\>]

    where

      <action> is one of 'deploy' and 'clean'

      <profile> is optional


## How To Test

  > cd test

  > edit event parameters in 'run_lambda.js' if necessary, especially 'roles' for role assuming

  > node run_lambda
