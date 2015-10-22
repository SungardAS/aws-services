
# Jenkins

Jenkins server for aws-services CI/CD

## How To Setup

    $ docker build -t alexough/asjenkins .
    $ docker create -v /var/jenkins_home --name as-jenkins-dv alexough/asjenkins
    $ docker run --volumes-from as-jenkins-dv -v <folder that has backup tar file in this host>:/backup --name as-restore alexough/asjenkins tar xvf /backup/backup.tar
    $ docker rm as-restore
    $ docker run -d -p <port in this host>:8080 --volumes-from as-jenkins-dv --name as-jenkins alexough/asjenkins

  > Go to the GitHub repository settings page,
      - Select 'Webhooks and services' and add a service hook for Jenkins (GitHub plugin)
      - Add the Jenkins hook url: http://<jenkins server:port>/github-webhook/
