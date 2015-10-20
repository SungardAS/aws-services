
BUILD_SUBDIRS := lib cloudformation billingalert awsconfig cloudtrail

build:
	echo $(BUILD_SUBDIRS)
	$(foreach dir,$(BUILD_SUBDIRS), make build -C $(dir);)

buildlambda:
	echo $(BUILD_SUBDIRS)
	$(foreach dir,$(BUILD_SUBDIRS), make buildlambda -C $(dir);)
