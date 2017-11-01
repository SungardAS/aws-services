#!/bin/bash

account="622821376834"
regions=("us-east-1" "us-west-2")

managedvolume="build.f/particles-managed-volume/config/default.js"

tLen=${#regions[@]}

for (( i=0; i<${tLen}; i++ ));
do
        echo $account
        echo ${regions[$i]}
        export AWS_REGION=${regions[$i]}
       sed -i "/region: /c\        region: '${regions[$i]}'," $managedvolume
       sed -i "/bucket: /c\        bucket: 'sgas.particles-managed-volume.$account.${regions[$i]}'" $managedvolume
       make clean
       make build
done

