ifdef AWS_REGION
else
       AWS_REGION := us-east-1
       export
endif

build:
	echo $(dir)
	make build -C $(dir)

buildlambda:
	echo $(dir)
	make buildlambda -C $(dir)

clean:
	echo $(dir)
	echo $(AWS_REGION)
	make clean -C $(dir)
