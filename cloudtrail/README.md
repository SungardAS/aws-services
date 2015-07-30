
## CloudTrail

AWS Lambda functions to manage the CloudTrail Service


### How to pre-configure before deploying functions

  > node deploy_cloudtrail preconfig


### How to deploy functions

  > node deploy_cloudtrail deploy -f preconfig -m 128 -t 10

  > node deploy_cloudtrail deploy -f checker -m 128 -t 3

  > node deploy_cloudtrail deploy -f enabler -m 128 -t 3

  > node deploy_cloudtrail deploy -f remover -m 128 -t 3

### How to remove functions

  > node deploy_cloudtrail remove -f preconfig

  > node deploy_cloudtrail remove -f checker

  > node deploy_cloudtrail remove -f enabler

  > node deploy_cloudtrail remove -f remover


### How to remove the pre-configuration

  > node deploy_cloudtrail remove_pre
