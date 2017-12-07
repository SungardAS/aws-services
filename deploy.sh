#!/bin/bash

FILENAME='particle-region-mapping'
declare -a REGIONS

while IFS=: read -r key value; do
        REGIONS=($value)
        for i in ${REGIONS[@]}; do
                export dir=$key
                export AWS_REGION=$i
                make build
        done
done < "$FILENAME"
