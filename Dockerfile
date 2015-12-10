FROM node:0.12.7

RUN apt-get update && apt-get install -y git

RUN mkdir -p /usr/src
WORKDIR /usr/src

RUN git clone https://github.com/SungardAS/aws-services
WORKDIR /usr/src/aws-services
RUN git checkout master
RUN git pull

CMD make
