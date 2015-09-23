
## AWSConfig

AWS Lambda functions to manage the AWSConfig Service


## How To Depoly & Remove Functions

  > cd build
  
  > edit parameter values in 'run_parameters.json'
  
  > node run_build \<action\> \<module\>
  
    where
    
      <action> is one of 'deploy' and 'clean'
      
      <module> is one of 'checker', 'enabler' and 'remover'


## How To Test

  > cd test
  
  > edit parameter values in 'run_lambda.js'
  
  > node run_build \<module\> [\<profile\>]
  
    where
    
      <module> is one of 'checker', 'enabler' and 'remover'
      
      <profile> is optional
