
ROOT_DIR:=$(shell dirname $(realpath $(lastword $(MAKEFILE_LIST))))
PROD_ACCOUNTS:=876224653878 714270045944 622821376834 509168795332 442294194136 445750067739 404016702201
DEV_ACCOUNTS:=876224653878 290093585298

ifdef AWS_REGION
else
	AWS_REGION := us-east-1
endif

ifdef ENV
	ifeq ($(ENV), dev)
		ACCOUNTS:=$(DEV_ACCOUNTS)
	else
		ACCOUNTS:=$(PROD_ACCOUNTS)
	endif
else
	ACCOUNTS:=$(PROD_ACCOUNTS)
endif

build: upload setup
	# no more tasks

buildlambda: upload update
	# no more tasks

buildnpm:
	npm install
	cd build.f/particles-initial; npm install
	cd build.f/particles-account; npm install

upload:
	echo $(ROOT_DIR)
	echo $(ACCOUNTS)
	npm install
	cd build.f; node run_upload_code index;
	cd build.f; node run_upload_code index_saver;
	cd build.f; node run_upload_code index_populator;

update:
	cd build.f; node run_update_code index;
	cd build.f; node run_update_code index_saver;
	cd build.f; node run_update_code index_populator;

setup:
	cd build.f/particles-initial; npm install; ./node_modules/.bin/gulp condensation:build;
	cd build.f/particles-account; npm install; ./node_modules/.bin/gulp condensation:build;
	cd build.f; node run_stack launch --region $(AWS_REGION) --name BillingAlertInitialSetup --parameters '[{"ParameterKey":"IsTest","ParameterValue":"$(TEST)"}]' --particles initial;
	$(foreach ACCOUNT,$(ACCOUNTS), \
		cd build.f; node run_stack launch --region $(AWS_REGION) --name BillingAlert-$(ACCOUNT) --parameters '[{"ParameterKey":"BillingAccountId","ParameterValue":"$(ACCOUNT)"},{"ParameterKey":"IsTest","ParameterValue":"$(TEST)"}]' --particles account;)

clean:
	$(foreach ACCOUNT,$(ACCOUNTS), \
		cd build.f; node run_stack drop --region $(AWS_REGION) --name BillingAlert-$(ACCOUNT))
	cd build.f; node run_stack drop --region $(AWS_REGION) --name BillingAlertInitialSetup;
