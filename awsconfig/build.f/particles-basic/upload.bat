cd ../../..
zip -r awsconfig.zip awsconfig/index_*.js awsconfig/json/*.json lib/flow_controller.js lib/aws/*.js
aws s3 cp awsconfig.zip s3://sgas.particles-awsconfig.blog.basic.us-east-1/particles/assets/awsconfig.zip --region us-east-1
mv awsconfig.zip awsconfig/build.f/particles-basic
cd awsconfig/build.f/particles-basic
