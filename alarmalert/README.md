
# Alarm Alert System

AWS micro service to send a notification whenever new alert email is detected.


## How To Setup

    $ make -e AWS_REGION=<region>


## How To Update Lambda Function Codes

    $ make buildlambda


## How To Remove Service

    $ make clean -e AWS_REGION=<region>


## How To Test Lambda Functions

    $ cd test
    $ node run_lambda <function_name>
      where
        <function_name> is 'index_saver'


## How to Create an OAuth 2.0 Client

https://developers.google.com/gmail/api/auth/web-server#create_a_client_id_and_client_secret

+ Go to ‘credential page’, https://console.developers.google.com/apis/credentials, of your gmail account

    + choose/create any project if asked

+ Click ‘Create credentials’ button and choose ‘OAuth client ID’

+ Choose ‘Other’ for Application type

+ Enter ‘Name’

+ Click ‘Create’ button

+ Click ‘OK’ in the popup window with the newly created client info

+ Find the line of newly create client under ‘OAuth 2.0 client IDs’

+ Download client data by clicking ‘Download JSON’ icon at the end of the line

+ Run a script, ‘aws-services/lib/google/token.js’ to get a token

    ```
    $ node token.js <file path of the downloaded client data in the previous step>
    ```

    + steps in the script, ‘token.js’
        - create ‘oauth2Client’ using the downloaded client data
        - connect to the authUrl and ‘allow’ to get an authorized code
        - use the authorized code to create a token

+ In API Manager - ‘Dashboard’

    + If 'Gmail API' is not in the list of 'API' on the right pane, enable if by clicking ‘ENABLE API’ button on the top of the right pane
