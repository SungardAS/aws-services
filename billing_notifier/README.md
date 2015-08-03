
## BillingNotifier

AWS Lambda function to support a billing alert


## How To Depoly & Remove Functions

### Environment Variables

  aws_profile : profile name in ~/.aws/credential
  aws_region : region where the function will be deployed/removed
  aws_account : AWS account id

### Deploy Functions

  > node deploy_notifier deploy -m <memory_size> -t <timeout> --sim=true|false

### Remove Functions

  > node deploy_notifier remove --sim=true|false


## How to populate 'EstimatedCharges' metric of 'CTOBilling'

  > node populate_sim_metric_data [-v <value>]
