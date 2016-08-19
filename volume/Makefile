
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
	# no more tasks

clean:
	# no more tasks
