
ROOT_DIR:=$(shell dirname $(realpath $(lastword $(MAKEFILE_LIST))))

build:
	echo $(ROOT_DIR)
	npm install

	cd build.f/particles-awsconfig; npm install; ./node_modules/.bin/gulp condensation:build;
	cd build.f; node run_upload_code index_checker;
	cd build.f; node run_upload_code index_enabler;
	cd build.f; node run_upload_code index_remover;

	aws cloudformation create-stack --stack-name AWSConfig --template-body file://$(ROOT_DIR)/build.f/particles-awsconfig/dist/0/particles/cftemplates/template.json --region us-east-1 --capabilities CAPABILITY_IAM;
	aws cloudformation describe-stacks --stack-name AWSConfig --region us-east-1;
