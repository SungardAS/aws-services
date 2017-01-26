
ifdef ACCOUNTS
else
	ACCOUNTS := 442294194136 714270045944
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

clean:
