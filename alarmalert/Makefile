
ROOT_DIR:=$(shell dirname $(realpath $(lastword $(MAKEFILE_LIST))))

build: upload setup

buildlambda: upload update

upload:
	echo $(ROOT_DIR)
	npm install
	cd build.f; node run_upload_code index_saver;

update:
	cd build.f; node run_update_code index_saver;

setup:
	cd build.f/particles-alarmalert; npm install; ./node_modules/.bin/gulp condensation:build;
	aws cloudformation create-stack --stack-name AlarmAlertSetup --template-body file://$(ROOT_DIR)/build.f/particles-alarmalert/dist/0/particles/cftemplates/template.json --region us-east-1 --capabilities CAPABILITY_IAM;
	aws cloudformation describe-stacks --stack-name AlarmAlertSetup --region us-east-1;

clean:
	aws cloudformation delete-stack --stack-name AlarmAlertSetup --region us-east-1;
	aws cloudformation describe-stacks --stack-name AlarmAlertSetup --region us-east-1;
