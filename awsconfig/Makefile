
ifdef AWS_REGION
else
	AWS_REGION := us-east-1
endif

build: upload setup
	# no more tasks

buildlambda: upload update
	# no more tasks

upload:
	npm install
	cd build.f; node run_upload_code;

update:
	npm install
	cd build.f; node run_update_code;

setup:
	cd build.f/particles-awsconfig; npm install; ./node_modules/.bin/gulp condensation:build; ./node_modules/.bin/gulp condensation:deploy;
	cd build.f; node run_stack launch --region $(AWS_REGION) --name AWSConfig --particles awsconfig;

clean:
	cd build.f; node run_stack drop --region $(AWS_REGION) --name AWSConfig;
