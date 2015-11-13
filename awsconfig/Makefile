
ROOT_DIR:=$(shell dirname $(realpath $(lastword $(MAKEFILE_LIST))))

ifdef AWS_REGION
else
	AWS_REGION := us-east-1
endif

build: upload setup
	# no more tasks

buildlambda: upload update
	# no more tasks

buildnpm:
	npm install;
	cd build.f/particles-awsconfig; npm install;

upload:
	echo $(ROOT_DIR)
	npm install
	cd build.f; node run_upload_code index_checker;
	cd build.f; node run_upload_code index_enabler;
	cd build.f; node run_upload_code index_remover;

update:
	npm install
	cd build.f; node run_update_code index_checker;
	cd build.f; node run_update_code index_enabler;
	cd build.f; node run_update_code index_remover;

setup:
	cd build.f/particles-awsconfig; npm install; ./node_modules/.bin/gulp condensation:build;
	cd build.f; node run_stack launch --region $(AWS_REGION) --name AWSConfig --particles awsconfig;

clean:
	cd build.f; node run_stack drop --region $(AWS_REGION) --name AWSConfig;
