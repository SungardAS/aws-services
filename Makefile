
BUILD_SUBDIRS := lib cloudformation billingalert awsconfig

build:
	echo $(BUILD_SUBDIRS)
	$(foreach dir,$(BUILD_SUBDIRS), make -C $(dir);)
