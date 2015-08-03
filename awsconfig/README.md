
## AWSConfig

AWS Lambda function to manage the AWSConfig Service


## How To Depoly & Remove Functions

### Environment Variables

  aws_profile : profile name in ~/.aws/credential
  aws_region : region where the function will be deployed/removed
  aws_account : AWS account id

### Deploy Functions

  > node deploy_awsconfig deploy -f <func_name> -m <memory_size> -t <timeout>

    where
    <func_name> is one of 'checker', 'enabler' or 'remover'

### Remove Functions

  > node deploy_awsconfig remove -f <func_name>

    where <func_name> is one of 'checker', 'enabler' or 'remover'

### Remove Role

  > node deploy_awsconfig remove_role


## How To Run Functions using CLI

  > aws lambda invoke \
    --invocation-type RequestResponse \
    --profile $aws_profile \
    --region $aws_region \
    --log-type Tail \
    --function-name <function_full_name> \
    --payload '{"region":"<region_where_function_run>", "account":"'$aws_account'"}' \
    outputfile.txt

    where
      <function_full_name> is one of 'awsconfig-checker', 'awsconfig-enabler' or 'awsconfig-remover'
      <region_where_function_run> is the region where the function will be run
