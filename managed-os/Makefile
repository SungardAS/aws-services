ifdef ACCOUNT
else
	ACCOUNT := 442294194136
	export
endif

TEST := false

AWS_REGIONS := us-east-1 us-east-2 us-west-1 us-west-2 eu-west-1 eu-west-2 eu-central-1 ca-central-1 ap-southeast-1 ap-southeast-2 ap-south-1 ap-northeast-1 ap-northeast-2 sa-east-1

build: 
	echo $(AWS_REGIONS)
	$(foreach AWS_REGION,$(AWS_REGIONS), export AWS_REGION=$(AWS_REGION); make setup;)

buildlambda: upload update

upload:
	npm install
	cd build.f; node run_upload_code;

update:
	npm install
	cd build.f; node run_update_code;

setup:
	cd build.f/particles-managed-os; npm install; ./node_modules/.bin/gulp condensation:build; ./node_modules/.bin/gulp condensation:deploy;
	cd build.f; node run_stack launch --region $(AWS_REGION) --name GetAMIId --particles managed-os;

clean:
	npm install;
	cd build.f; node run_stack drop --region $(AWS_REGION) --name GetAMIId;
