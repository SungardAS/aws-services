ifdef ACCOUNTS
else
	ACCOUNTS := 442294194136
endif

TEST := false

ifdef AWS_REGIONS
else
	AWS_REGIONS := us-east-1 us-east-2 us-west-1 us-west-2
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
	cd build.f/particles-managed-os; npm install; ./node_modules/.bin/gulp condensation:build; ./node_modules/.bin/gulp condensation:deploy;
	$(foreach AWS_REGION,$(AWS_REGIONS),\
		cd build.f; node run_stack launch --region $(AWS_REGION) --name GetAMIId --particles managed-os;)

clean:
	npm install;
	$(foreach AWS_REGION,$(AWS_REGIONS),\
		cd build.f; node run_stack drop --region $(AWS_REGION) --name GetAMIId;)
