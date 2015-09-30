
## Billing Alert System

AWS micro service to send a notification when the increased percentage of 'EstimatedCharges' exceeds the defined threshold.


## How To Depoly & Remove System

  > cd build

  > create a CloudFormation stack using 'billing_alert_init.cfn'

  > edit parameter values in 'run_params.json'

  > node run_build \<action\> [\<profile\>]

    where

      <action> is one of 'deploy' and 'clean'

      <profile> is optional

  > create a CloudFormation stack using 'billing_alert.cfn' for each account to monitor


## How To Test

  > cd test

  > node run_lambda [\<profile\>]

    where

      <profile> is optional
