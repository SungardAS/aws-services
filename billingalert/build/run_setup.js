
var setup = new(require('./setup'))();

/*
// CTO Master Account for billing
var federateAccount = '054649790173';
var account = '054649790173';
var roleName = 'sgas_admin';
*/

/*
// Dev Master Account for billing
var federateAccount = '089476987273';
var account = '089476987273';
var roleName = 'sgas_dev_admin';
*/

profile = 'default';
//account = '089476987273';
//account = '290093585298';
account = '876224653878';
params = {
  "federate_awsid":"089476987273",
  "federate_role":"sgas_dev_admin",
  "master_awsid":"089476987273",
  "master_aws_externalid":"88df904d-c597-40ef-8b29-b767aba1eaa4",
  "billing_awsid":null,
  "sim":true,
  "profile":profile
}
params.billing_awsid = account;
setup.deploy(params);
