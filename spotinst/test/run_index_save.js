
var i = require('../index_save.js');
var event = {
  "Records": [
    {
      "EventSource": "aws:sns",
      "EventVersion": "1.0",
      "EventSubscriptionArn": "arn:aws:sns:us-east-1:290093585298:IncreasedPercentagesTopic:8159ee60-84e6-438a-be32-136f8361c0fc",
      "Sns": {
        "Type": "Notification",
        "MessageId": "598410f7-230a-5e95-a475-5ec2f9357673",
        "TopicArn": "arn:aws:sns:us-east-1:290093585298:IncreasedPercentagesTopic",
        "Subject": "ALARM: \"IncreasedPercentagesAlarm\" in US - N. Virginia",
        "Message": "{ \"InstanceId\": \"i-3b0f3635\", \"ImageId\": \"ami-05355a6c\", \"State\": { \"Code\": 16, \"Name\": \"running\" }, \"PrivateDnsName\": \"ip-10-0-12-56.ec2.internal\", \"PublicDnsName\": \"ec2-54-197-28-74.compute-1.amazonaws.com\", \"StateTransitionReason\": \"\", \"AmiLaunchIndex\": 0, \"ProductCodes\": [], \"InstanceType\": \"t1.micro\", \"LaunchTime\": \"2016-08-19T23:28:57.000Z\", \"Placement\": { \"AvailabilityZone\": \"us-east-1a\", \"GroupName\": \"\", \"Tenancy\": \"default\" }, \"KernelId\": \"aki-88aa75e1\", \"Monitoring\": { \"State\": \"disabled\" }, \"SubnetId\": \"subnet-31c47847\", \"VpcId\": \"vpc-b8266edc\", \"PrivateIpAddress\": \"10.0.12.56\", \"PublicIpAddress\": \"54.197.28.74\", \"Architecture\": \"x86_64\", \"RootDeviceType\": \"ebs\", \"RootDeviceName\": \"/dev/sda1\", \"BlockDeviceMappings\": [ { \"DeviceName\": \"/dev/sda1\", \"Ebs\": { \"VolumeId\": \"vol-5e584ef3\", \"Status\": \"attached\", \"AttachTime\": \"2016-08-19T23:28:58.000Z\", \"DeleteOnTermination\": true } } ], \"VirtualizationType\": \"paravirtual\", \"ClientToken\": \"57ba53ad80e92cc509ae480c2d0c46f4\", \"Tags\": [], \"SecurityGroups\": [ { \"GroupName\": \"dev-api-AppStack-1LJ0B53SUJFWM-AppSecurityGroup-1OI8F8TKPGFIE\", \"GroupId\": \"sg-0de9fc74\" } ], \"SourceDestCheck\": true, \"Hypervisor\": \"xen\", \"NetworkInterfaces\": [ { \"NetworkInterfaceId\": \"eni-d55b29d1\", \"SubnetId\": \"subnet-31c47847\", \"VpcId\": \"vpc-b8266edc\", \"Description\": \"\", \"OwnerId\": \"089476987273\", \"Status\": \"in-use\", \"MacAddress\": \"0a:7a:7f:e3:c5:a7\", \"PrivateIpAddress\": \"10.0.12.56\", \"PrivateDnsName\": \"ip-10-0-12-56.ec2.internal\", \"SourceDestCheck\": true, \"Groups\": [ { \"GroupName\": \"dev-api-AppStack-1LJ0B53SUJFWM-AppSecurityGroup-1OI8F8TKPGFIE\", \"GroupId\": \"sg-0de9fc74\" } ], \"Attachment\": { \"AttachmentId\": \"eni-attach-7cb2a2af\", \"DeviceIndex\": 0, \"Status\": \"attached\", \"AttachTime\": \"2016-08-19T23:28:57.000Z\", \"DeleteOnTermination\": true }, \"Association\": { \"PublicIp\": \"54.197.28.74\", \"PublicDnsName\": \"ec2-54-197-28-74.compute-1.amazonaws.com\", \"IpOwnerId\": \"amazon\" }, \"PrivateIpAddresses\": [ { \"PrivateIpAddress\": \"10.0.12.56\", \"PrivateDnsName\": \"ip-10-0-12-56.ec2.internal\", \"Primary\": true, \"Association\": { \"PublicIp\": \"54.197.28.74\", \"PublicDnsName\": \"ec2-54-197-28-74.compute-1.amazonaws.com\", \"IpOwnerId\": \"amazon\" } } ] } ], \"IamInstanceProfile\": { \"Arn\": \"arn:aws:iam::089476987273:instance-profile/DataPipelineDefaultResourceRole\", \"Id\": \"AIPAJOO54ZOZEEYHNZWII\" }, \"EbsOptimized\": false, \"Metrics\": { \"Timestamp\": \"2016-08-25T10:39:00.000Z\", \"SampleCount\": 235, \"Average\": 2.113574468085106, \"Sum\": 496.6899999999999, \"Minimum\": 0, \"Maximum\": 5, \"Unit\": \"Percent\" } }",
        "Timestamp": "2015-07-31T20:18:07.515Z",
        "SignatureVersion": "1",
        "Signature": "zkNXuSsbOLqir3Khiw2e/5Fmy8x59IpBHQba4Q77nCbWg21NVFvLjV0TgSvhuk0AiFEQsqD/larWtn/PyOCJBT+kyXl6UsilX30/EYNqfREzF8ZqbfUoG+2TEOu2HwHTnIUDkLVfBUZjFzJ8tUI43wieE/RaeZBZUKhrfIP/q0rpPIf99GyA5tAtxFOdF4jboc56c9w1POh+RA8GdlMd9/H3Rh4CwoRc0jeaEQsf4aHBuKnLlJphQ2Qx3q0GVE/nv9c+QQty0A8v4YkOdpMv9g6aV+LHUDCM865c3iGsU251SNcgB18zTLIBjsJtEWxndAGJAGnPMwYmV5x1DJbDcg==",
        "SigningCertUrl": "https://sns.us-east-1.amazonaws.com/SimpleNotificationService-d6d679a1d18e95c2f9ffcf11f4f9e198.pem",
        "UnsubscribeUrl": "https://sns.us-east-1.amazonaws.com/?Action=Unsubscribe&SubscriptionArn=arn:aws:sns:us-east-1:290093585298:IncreasedPercentagesTopic:8159ee60-84e6-438a-be32-136f8361c0fc",
        "MessageAttributes": {}
      }
    }
  ]
}
var context = {};
i.handler(event, context, function(err, data) {
  if (err)  console.log(err);
  console.log("successfully completed");
  console.log(data);
});
