FROM centos:7
MAINTAINER Karl Stoney <me@karlstoney.com>

RUN groupadd hawkeye && \
    useradd -g hawkeye hawkeye

# Get nodejs repos
RUN curl --silent --location https://rpm.nodesource.com/setup_7.x | bash -

RUN yum -y -q update && \
    yum -y -q remove iputils && \
    yum -y -q install wget epel-release openssl openssl-devel tar unzip \
							libffi-devel python-devel redhat-rpm-config git-core \
							gcc gcc-c++ make zlib-devel pcre-devel ca-certificates \
              nodejs && \
    yum -y -q clean all

# Install hawkeye
RUN mkdir -p /app
WORKDIR /app
EXPOSE 5000
CMD ["npm", "run", "web"]

# If we ever change the hawkeye version, redo everything below
ARG HE_VERSION=
RUN yum -y -q update && \
    yum -y -q clean all

COPY package.json /app
RUN cd /app && \
    npm install --quiet && \
    chown -R hawkeye:hawkeye /app

COPY ./ /app
RUN npm run assets
RUN find . -type d \( -path ./node_modules \) -prune -o -exec chown hawkeye:hawkeye {} \;
USER hawkeye
