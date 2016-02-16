cd ../../..
zip -r awsconfig.zip awsconfig/index_*.js awsconfig/json/*.json lib/flow_controller.js lib/aws/*.js
aws s3 cp awsconfig.zip s3://sgas.awsconfig.custom.290093585298.us-east-1/particles/assets/awsconfig.zip --region us-east-1
mv awsconfig.zip awsconfig/build.f/particles-custom
zip -r cloudformation_builder.zip cloudformation/index_lambda_deployer.js cloudformation/lambda_deployer.js cloudformation/index_iam_federation.js cloudformation/iam_federation.js
aws s3 cp cloudformation_builder.zip s3://sgas.awsconfig.custom.290093585298.us-east-1/particles/assets/cloudformation_builder.zip --region us-east-1
mv cloudformation_builder.zip awsconfig/build.f/particles-custom
cd awsconfig/build.f/particles-custom
