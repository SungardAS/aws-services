#!/bin/bash

account="622821376834"
regions=("us-east-1" "us-east-2" "us-west-1" "us-west-2" "ap-southeast-1" "ap-southeast-2" "ap-northeast-1" "ap-northeast-2" "ap-south-1" "eu-central-1" "eu-west-1" "eu-west-2" "ca-central-1" "sa-east-1")

managedos="build.f/particles-managed-os/config/default.js"

tLen=${#regions[@]}

for (( i=0; i<${tLen}; i++ ));
do
        echo $account
        echo ${regions[$i]}
        export AWS_REGION=${regions[$i]}
       sed -i "/region: /c\        region: '${regions[$i]}'," $managedos
       sed -i "/bucket: /c\        bucket: 'sgas.particles-managed-os.$account.${regions[$i]}'" $managedos
       make clean
       make build
done

