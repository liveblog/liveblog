# import base image
FROM python:3.5

# install system-wide dependencies,
# python3 and the build-time dependencies for c modules
RUN apt-get update && \
apt-get install -y --no-install-recommends \
build-essential libffi-dev git locales \
libtiff5-dev libjpeg62-turbo-dev zlib1g-dev \
libfreetype6-dev liblcms2-dev libwebp-dev \
curl libfontconfig nodejs npm nginx 

ENV APP_HOME /opt/superdesk/
RUN mkdir $APP_HOME
WORKDIR $APP_HOME

RUN echo "\ndaemon off;" >> /etc/nginx/nginx.conf 
RUN rm /etc/nginx/sites-enabled/default 
RUN ln --symbolic /usr/bin/nodejs /usr/bin/node

RUN npm install -g npm
RUN npm -g install grunt-cli bower

# Set the locale
RUN locale-gen en_US.UTF-8
ENV LANG en_US.UTF-8
ENV LANGUAGE en_US:en
ENV LC_ALL en_US.UTF-8

# setup the environment
COPY ./docker/nginx.conf /etc/nginx/nginx.conf
COPY ./docker/superdesk_vhost.conf /etc/nginx/sites-enabled/superdesk.conf
COPY ./docker/start.sh $APP_HOME/start.sh
COPY ./docker/start-dev.sh $APP_HOME/start-dev.sh
RUN chmod +x start.sh
RUN chmod +x start-dev.sh
CMD start.sh

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

# install server dependencies
COPY ./server/requirements.txt /tmp/requirements.txt
RUN cd /tmp && pip install -U -r /tmp/requirements.txt

# install client dependencies
COPY ./client/package.json $APP_HOME/client/
RUN cd ./client && npm install --global npm-install-que
RUN cd ./client && npm-install-que
COPY ./client/bower.json $APP_HOME/client/
COPY ./client/.bowerrc $APP_HOME/client/
RUN cd ./client && bower --allow-root install
#RUN cd ./client && npm install -d grunt
#RUN cd ./client && npm install -d grunt-cli



# copy server sources
COPY ./server $APP_HOME/

# copy client sources
COPY ./client $APP_HOME/client

# TODO: this is hack to update basic themes during bamboo deployment
COPY ./server/liveblog/themes/themes_assets/ $APP_HOME/themes_assets/

RUN cd ./client && grunt build
