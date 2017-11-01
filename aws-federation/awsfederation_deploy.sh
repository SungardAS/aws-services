#!/bin/bash

account="622821376834"

regions=("us-east-2" "us-west-1" "us-west-2" "ap-southeast-1" "ap-southeast-2" "ap-northeast-1" "ap-northeast-2" "ap-south-1" "eu-central-1" "eu-west-1" "eu-west-2" "ca-central-1" "sa-east-1")

awsfederation="build.f/particles-aws-federation/config/default.js"

tLen=${#regions[@]}

for (( i=0; i<${tLen}; i++ ));
do
        echo $account
        echo ${regions[$i]}
        echo $(env)
        export AWS_REGION=${regions[$i]}
       sed -i "/region: /c\        region: '${regions[$i]}'," $awsfederation
       sed -i "/bucket: /c\        bucket: 'sgas.particles-aws-federation.$account.${regions[$i]}'" $awsfederation
#       make clean
        make 
done

