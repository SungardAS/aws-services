
ROOT_DIR:=$(shell dirname $(realpath $(lastword $(MAKEFILE_LIST))))

TEST:=true
ifeq ($(TEST),true)
  INDEX=index_test
else
  INDEX=index
endif

ACCOUNTS:=290093585298 876224653878

build:
	echo $(ROOT_DIR)
	echo $(TEST)
	npm install

	cd build.f/particles-initial; npm install; ./node_modules/.bin/gulp condensation:build;
	cd build.f/particles-account; npm install; ./node_modules/.bin/gulp condensation:build;
	cd build.f/particles-populator; npm install; ./node_modules/.bin/gulp condensation:build;
	node build.f/run_upload_code $(INDEX);
	node build.f/run_upload_code index_saver;
	node build.f/run_upload_code index_populator;

	aws cloudformation create-stack --stack-name BillingAlertInitialSetup --template-body file://$(ROOT_DIR)/build.f/particles-initial/dist/0/particles/cftemplates/template.json --region us-east-1 --capabilities CAPABILITY_IAM --parameters ParameterKey=IsTest,ParameterValue=$(TEST);
	aws cloudformation describe-stacks --stack-name BillingAlertInitialSetup --region us-east-1;

	$(foreach ACCOUNT,$(ACCOUNTS), \
		aws cloudformation create-stack --stack-name BillingAlert-$(ACCOUNT) --template-body file://$(ROOT_DIR)/build.f/particles-account/dist/0/particles/cftemplates/template.json --region us-east-1 --capabilities CAPABILITY_IAM --parameters ParameterKey=BillingAccountId,ParameterValue=$(ACCOUNT) ParameterKey=IsTest,ParameterValue=$(TEST); \
		aws cloudformation describe-stacks --stack-name BillingAlert-$(ACCOUNT) --region us-east-1;)

	aws cloudformation create-stack --stack-name BillingAlertPopulator --template-body file://$(ROOT_DIR)/build.f/particles-populator/dist/0/particles/cftemplates/template.json --region us-east-1 --capabilities CAPABILITY_IAM;
	aws cloudformation describe-stacks --stack-name BillingAlertPopulator --region us-east-1;