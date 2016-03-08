
ifdef ACCOUNTS
else
	ACCOUNTS := 876224653878 714270045944 622821376834 509168795332 442294194136 445750067739 404016702201
endif

ifdef AWS_REGION
else
	AWS_REGION := us-east-1
endif

build: setup

buildlambda: upload update

upload:
	npm install
	cd build.f; node run_upload_code;

update:
	npm install
	cd build.f; node run_update_code;

setup:
	cd build.f/particles-initial; npm install; ./node_modules/.bin/gulp condensation:build; ./node_modules/.bin/gulp condensation:deploy;
	cd build.f/particles-account; npm install; ./node_modules/.bin/gulp condensation:build; ./node_modules/.bin/gulp condensation:deploy;
	cd build.f; node run_stack launch --region $(AWS_REGION) --name BillingAlertInitialSetup --parameters '[{"ParameterKey":"IsTest","ParameterValue":"$(TEST)"}]' --particles initial;
	$(foreach ACCOUNT,$(ACCOUNTS), \
		cd build.f; node run_stack launch --region $(AWS_REGION) --name BillingAlert-$(ACCOUNT) --parameters '[{"ParameterKey":"BillingAccountId","ParameterValue":"$(ACCOUNT)"},{"ParameterKey":"IsTest","ParameterValue":"$(TEST)"}]' --particles account;)

clean:
	npm install;
	$(foreach ACCOUNT,$(ACCOUNTS), \
		cd build.f; node run_stack drop --region $(AWS_REGION) --name BillingAlert-$(ACCOUNT))
	cd build.f; node run_stack drop --region $(AWS_REGION) --name BillingAlertInitialSetup;
