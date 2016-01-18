
# Jenkins

Jenkins server for aws-services CI/CD

## How To Setup

    $ create a stack after deploying the condensation in 'build.f/particles-jenkins'
    $ curl -X POST http://<jenkins server:port>/createItem?name=aws-services-us-east-1 --header "Content-Type: application/xml" -d @aws-services-us-east-1.xml
    $ curl -X POST http://<jenkins server:port>/createItem?name=aws-services-us-west-2 --header "Content-Type: application/xml" -d @aws-services-us-west-2.xml

  > Go to the GitHub repository settings page,

      - Select 'Webhooks and services' and add a service hook for Jenkins (GitHub plugin)
      - Add the Jenkins hook url: http://<jenkins server:port>/github-webhook/
