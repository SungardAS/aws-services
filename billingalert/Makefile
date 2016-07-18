
ifdef ACCOUNTS
else
	ACCOUNTS := 876224653878 714270045944 622821376834 509168795332 442294194136 445750067739 404016702201 290093585298 266593598212 054649790173 992852660524 846805764266 784442297447 978587332037 041802784822 737385712994 089476987273 815082807540 607481993316 735253318557 745968232654 546276914724 425660908425 050132637519 124723047894 059504812767 467276579997 326659710197 884116064491 704579740447 666148197850 282307656817
endif

TEST := false

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

setup_accounts:
	cd build.f/particles-account; npm install; ./node_modules/.bin/gulp condensation:build; ./node_modules/.bin/gulp condensation:deploy;
	$(foreach ACCOUNT,$(ACCOUNTS), \
		cd build.f; node run_stack launch --region $(AWS_REGION) --name BillingAlert-$(ACCOUNT) --parameters '[{"ParameterKey":"BillingAccountId","ParameterValue":"$(ACCOUNT)"},{"ParameterKey":"IsTest","ParameterValue":"$(TEST)"}]' --particles account;)

clean:
	npm install;
	$(foreach ACCOUNT,$(ACCOUNTS), \
		cd build.f; node run_stack drop --region $(AWS_REGION) --name BillingAlert-$(ACCOUNT))
	cd build.f; node run_stack drop --region $(AWS_REGION) --name BillingAlertInitialSetup;
