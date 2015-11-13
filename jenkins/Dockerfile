FROM jenkins

USER root

# Install dependencies for building node.
RUN apt-get update && apt-get install -y \
    build-essential \
    gcc \
    git

# Install node from source.
RUN wget http://nodejs.org/dist/v0.12.7/node-v0.12.7.tar.gz && \
    tar -zxf node-v0.12.7.tar.gz && \
    cd node-v0.12.7 && \
    ./configure && \
    make && \
    make install

RUN cd / && \
    rm node-v0.12.7.tar.gz && \
    rm -drf node-v0.12.7

COPY plugins.txt /usr/share/jenkins/plugins.txt
RUN /usr/local/bin/plugins.sh /usr/share/jenkins/plugins.txt

USER jenkins
