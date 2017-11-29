FROM centos:7
MAINTAINER Karl Stoney <me@karlstoney.com>

RUN groupadd hawkeye && \
    useradd -g hawkeye hawkeye

# Get nodejs repos
RUN curl --silent --location https://rpm.nodesource.com/setup_8.x | bash -

RUN yum -y -q update && \
    yum -y -q remove iputils && \
    yum -y -q install wget epel-release openssl openssl-devel tar unzip \
							libffi-devel python-devel redhat-rpm-config git-core \
							gcc gcc-c++ make zlib-devel pcre-devel ca-certificates \
    yum -y -q clean all

ENV NODE_VERSION=8.9.1
ENV NPM_VERSION=5.5.1

# Get nodejs repos
RUN curl --silent --location https://rpm.nodesource.com/setup_8.x | bash -

RUN yum -y install nodejs-$NODE_VERSION && \
    yum -y clean all

RUN rm -rf /usr/lib/node_modules/npm && \
    mkdir /usr/lib/node_modules/npm && \
    curl -sL https://github.com/npm/npm/archive/v$NPM_VERSION.tar.gz | tar xz -C /usr/lib/node_modules/npm --strip-components=1

RUN node --version && \
    npm --version

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
RUN chown -R hawkeye:hawkeye /app
USER hawkeye
