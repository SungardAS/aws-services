
## AWSConfig

AWS Lambda function to manage the AWSConfig Service


### How to pre-configure before deploying functions

  > node deploy_aws_config preconfig


### How to deploy functions

  > node deploy_aws_config deploy -f preconfig -m 128 -t 10

  > node deploy_aws_config deploy -f checker -m 128 -t 3

  > node deploy_aws_config deploy -f enabler -m 128 -t 10

  > node deploy_aws_config deploy -f remover -m 128 -t 10

### How to remove functions

  > node deploy_aws_config remove -f preconfig

  > node deploy_aws_config remove -f checker

  > node deploy_aws_config remove -f enabler

  > node deploy_aws_config remove -f remover

### How to remove the pre-configuration

  > node deploy_aws_config remove_pre
