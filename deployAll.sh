#!/bin/bash

account="261299584329"
regions=("us-east-1" "us-east-2" "us-west-1" "us-west-2" "ap-southeast-1" "ap-southeast-2" "ap-northeast-1" "ap-northeast-2" "ap-south-1" "eu-central-1" "eu-west-1" "eu-west-2" "ca-central-1" "sa-east-1")

awsconfig="awsconfig/build.f/particles-awsconfig/config/default.js"
awsconfigrules="awsconfigrules/build.f/particles-awsconfigrules/config/default.js"
awsconfignotificationalert="awsconfig-notification-alert/build.f/particles-initial/config/default.js"
enhancesnapshot="enhancesnapshot/build.f/particles-enhancesnapshot/config/default.js"
cloudtrail="cloudtrail/build.f/particles-cloudtrail/config/default.js"
awsstacklauncher="awscfn-stack-launcher/build.f/particles-awscfn-stack-launcher/config/default.js"
managedos="managed-os/build.f/particles-managed-os/config/default.js"
managedelb="managed-elb/build.f/particles-initial/config/default.js"
managedvpc="managed-vpc/build.f/particles-initial/config/default.js"
managedvolume="managed-volume/build.f/particles-managed-volume/config/default.js"
awsfederation="aws-federation/build.f/particles-aws-federation/config/default.js"
makefile="Makefile"

sed -e '0,/BUILD_SUBDIRS/ s/^#*/#/' -i $makefile
sed '/#BUILD_SUBDIRS/a BUILD_SUBDIRS := lib awsconfig cloudtrail awsconfigrules awsconfig-notification-alert enhancesnapshot awscfn-stack-launcher managed-os managed-elb managed-vpc managed-volume' -i $makefile

tLen=${#regions[@]}

for (( i=0; i<${tLen}; i++ ));
do
        echo $account
        echo ${regions[$i]}
        export AWS_REGION=${regions[$i]}
if [ ${regions[$i]} = 'us-east-1' ] ;
then
       sed -i "/region: /c\        region: '${regions[$i]}'," $awsconfig
       sed -i "/bucket: /c\        bucket: 'sgas.particles-awsconfig.$account.${regions[$i]}'" $awsconfig
       sed -i "/region: /c\        region: '${regions[$i]}'," $awsconfigrules
       sed -i "/bucket: /c\        bucket: 'sgas.test.particles-awsconfigrules.$account.${regions[$i]}'" $awsconfigrules
       sed -i "/region: /c\        region: '${regions[$i]}'," $awsconfignotificationalert
       sed -i "/bucket: /c\        bucket: 'sgas.particles-notificationalert.$account.${regions[$i]}'" $awsconfignotificationalert
       sed -i "/region: /c\        region: '${regions[$i]}'," $enhancesnapshot
       sed -i "/bucket: /c\        bucket: 'sgas.particles-enhancesnapshot.$account.${regions[$i]}'" $enhancesnapshot
       sed -i "/region: /c\        region: '${regions[$i]}'," $cloudtrail
       sed -i "/bucket: /c\        bucket: 'sgas.particles-cloudtrail.$account.${regions[$i]}'" $cloudtrail
       sed -i "/region: /c\        region: '${regions[$i]}'," $awsstacklauncher
       sed -i "/bucket: /c\        bucket: 'sgas.particles-cfn-launch.$account.${regions[$i]}'" $awsstacklauncher
       sed -i "/region: /c\        region: '${regions[$i]}'," $managedos
       sed -i "/bucket: /c\        bucket: 'sgas.particles-managed-os.$account.${regions[$i]}'" $managedos
       sed -i "/region: /c\        region: '${regions[$i]}'," $managedelb
       sed -i "/bucket: /c\        bucket: 'sgas.particles-managed-elb.$account.${regions[$i]}'" $managedelb
       sed -i "/region: /c\        region: '${regions[$i]}'," $managedvpc
       sed -i "/bucket: /c\        bucket: 'sgas.particles-managed-vpc.$account.${regions[$i]}'" $managedvpc
       sed -i "/region: /c\        region: '${regions[$i]}'," $managedvolume
       sed -i "/bucket: /c\        bucket: 'sgas.particles-managed-volume.$account.${regions[$i]}'" $managedvolume
       sed -i "/region: /c\        region: '${regions[$i]}'," $awsfederation
       sed -i "/bucket: /c\        bucket: 'sgas.particles-aws-federation.$account.${regions[$i]}'" $awsfederation
       make clean
       make build
       continue
else
       sed -i "/region: /c\        region: '${regions[$i]}'," $awsconfigrules
       sed -i "/bucket: /c\        bucket: 'sgas.test.particles-awsconfigrules.$account.${regions[$i]}'" $awsconfigrules
       sed -i "/region: /c\        region: '${regions[$i]}'," $awsconfignotificationalert
       sed -i "/bucket: /c\        bucket: 'sgas.particles-notificationalert.$account.${regions[$i]}'" $awsconfignotificationalert
       sed -i "/region: /c\        region: '${regions[$i]}'," $managedos
       sed -i "/bucket: /c\        bucket: 'sgas.particles-managed-os.$account.${regions[$i]}'" $managedos
       sed -i "/region: /c\        region: '${regions[$i]}'," $awsfederation
       sed -i "/bucket: /c\        bucket: 'sgas.particles-aws-federation.$account.${regions[$i]}'" $awsfederation
       make clean
       make build
fi
done

