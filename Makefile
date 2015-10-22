
BUILD_SUBDIRS := lib cloudformation billingalert awsconfig cloudtrail alarmalert

ifdef AWS_REGION
else
	AWS_REGION := us-east-1
	export
endif

build:
	echo $(BUILD_SUBDIRS)
	$(foreach dir,$(BUILD_SUBDIRS), make build -C $(dir);)

buildlambda:
	echo $(BUILD_SUBDIRS)
	$(foreach dir,$(BUILD_SUBDIRS), make buildlambda -C $(dir);)

buildnpm:
	echo $(BUILD_SUBDIRS)
	$(foreach dir,$(BUILD_SUBDIRS), make buildnpm -C $(dir);)

clean:
	echo $(BUILD_SUBDIRS)
	echo $(AWS_REGION)
	$(foreach dir,$(BUILD_SUBDIRS), make clean -C $(dir);)
