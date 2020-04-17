# import base image
FROM ubuntu:bionic

# install system-wide dependencies,
# python3 and the build-time dependencies for c modules
RUN apt-get update && \
DEBIAN_FRONTEND=noninteractive apt-get install -y --no-install-recommends \
python3 python3-dev python3-pip python3-lxml \
build-essential libffi-dev git locales \
libtiff5-dev libjpeg8-dev zlib1g-dev libmagic-dev \
libfreetype6-dev liblcms2-dev libwebp-dev \
curl libfontconfig nodejs npm nginx \
&& echo "\ndaemon off;" >> /etc/nginx/nginx.conf \
&& rm /etc/nginx/sites-enabled/default

# Set the locale
RUN locale-gen en_US.UTF-8
ENV LANG en_US.UTF-8
ENV LANGUAGE en_US:en
ENV LC_ALL en_US.UTF-8

# setup the environment
WORKDIR /opt/server/
COPY ./docker/nginx.conf /etc/nginx/nginx.conf
COPY ./docker/superdesk_vhost.conf /etc/nginx/sites-enabled/superdesk.conf
COPY ./docker/start.sh ./start.sh

# client ports
EXPOSE 9000
EXPOSE 80
# server ports
EXPOSE 5000
EXPOSE 5100

# set env vars for the server
ENV PYTHONUNBUFFERED 1
ENV C_FORCE_ROOT "False"
ENV CELERYBEAT_SCHEDULE_FILENAME /tmp/celerybeatschedule.db
ENV TZ Europe/London

RUN python3 -m pip install --upgrade pip setuptools wheel
RUN npm install -g npm grunt-cli

# install server dependencies
COPY ./server/requirements.txt /tmp/requirements.txt
RUN cd /tmp && python3 -m pip install -U -r /tmp/requirements.txt

# install client dependencies
COPY ./client/package.json ./client/
RUN cd ./client && npm install

# copy server sources
COPY ./server .

# copy client sources
COPY ./client ./client

# TODO: this is hack to update basic themes during bamboo deployment
COPY ./server/liveblog/themes/themes_assets/ ./themes_assets/

CMD /opt/server/start.sh
