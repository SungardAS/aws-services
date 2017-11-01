#!/bin/bash

account="622821376834"
regions=("us-east-1" "us-west-2")

managedelb="build.f/particles-initial/config/default.js"

tLen=${#regions[@]}

for (( i=0; i<${tLen}; i++ ));
do
        echo $account
        echo ${regions[$i]}
        export AWS_REGION=${regions[$i]}
       sed -i "/region: /c\        region: '${regions[$i]}'," $managedelb
       sed -i "/bucket: /c\        bucket: 'sgas.particles-managed-elb.$account.${regions[$i]}'" $managedelb
       make clean
       make build
done

