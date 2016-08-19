
# Volume

This is a Lambda function to tag untagged volumes in all regions. It is scheduled to run every 10 minutes.


## Manual steps before deployment

   1. create an Encryption Key with default values through the AWS IAM console in target region(s)

   2. encrypt the 'msaws' database password using the newly created encryption key in step 1

   3. create 'data_\<AWS_ACCOUNT_ID\>_\<REGION_NAME\>.json' file under 'json' folder and store the encrypted password along with other data
      - reference already existing data files
      - replace '-' with '_' in \<REGION_NAME\>

## How To Setup

   1. build the cloudformation template using the condensation particles

   2. create a stack through the AWS Cloudformation console with these parameter values
      - SecurityGroupIds : AppSecurityGroupId of AppStack in MSAWS
      - SubnetIds : 2 private subnets of VpcStack in MSAWS


## How To Update Lambda Function Codes

   $ make buildlambda
