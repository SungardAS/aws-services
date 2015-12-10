
ifdef AWS_REGION
else
	AWS_REGION := us-east-1
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
	npm install
	cd build.f; node run_upload_code index;
	cd build.f; node run_upload_code index_saver;

update:
	cd build.f; node run_update_code index;
	cd build.f; node run_update_code index_saver;

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
