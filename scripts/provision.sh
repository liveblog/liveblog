#!/bin/bash
# IMPORTANT: Script only for Ubuntu Trusty
# Setting up environment variables
COLOR='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${COLOR}Setting environment variables${NC}"

echo "SUPERDESK_RELOAD=True" | sudo tee --append /etc/environment
echo "SUPERDESK_URL=http://localhost:5000/api" | sudo tee --append /etc/environment
echo "SUPERDESK_WS_URL=ws://localhost:5050" | sudo tee --append /etc/environment
echo "SUPERDESK_CLIENT_URL=http://localhost:9000" | sudo tee --append /etc/environment
echo "ELASTICSEARCH_URL=http://localhost:9200" | sudo tee --append /etc/environment
echo "ELASTICSEARCH_INDEX" | sudo tee --append /etc/environment
echo "CELERY_BROKER_URL=redis://localhost:6379/1" | sudo tee --append /etc/environment
echo "REDIS_URL=redis://localhost:6379/1" | sudo tee --append /etc/environment
echo "LOG_SERVER_ADDRESS=logstash" | sudo tee --append /etc/environment
echo "LOG_SERVER_PORT=5555" | sudo tee --append /etc/environment
echo "AMAZON_ACCESS_KEY_ID" | sudo tee --append /etc/environment
echo "AMAZON_CONTAINER_NAME" | sudo tee --append /etc/environment
echo "AMAZON_REGION" | sudo tee --append /etc/environment
echo "AMAZON_SECRET_ACCESS_KEY" | sudo tee --append /etc/environment
echo "S3_THEMES_PREFIX" | sudo tee --append /etc/environment
echo "REUTERS_USERNAME" | sudo tee --append /etc/environment
echo "REUTERS_PASSWORD" | sudo tee --append /etc/environment
echo "MAIL_SERVER=postfix" | sudo tee --append /etc/environment
echo "MAIL_PORT=25" | sudo tee --append /etc/environment
echo "MAIL_USE_TLS=false" | sudo tee --append /etc/environment
echo "MAIL_USE_SSL=false" | sudo tee --append /etc/environment
echo "MAIL_USERNAME=user" | sudo tee --append /etc/environment
echo "MAIL_PASSWORD=pwd" | sudo tee --append /etc/environment
echo "SENTRY_DSN" | sudo tee --append /etc/environment
echo "SUPERDESK_URL=http://127.0.0.1/api" | sudo tee --append /etc/environment
echo "SUPERDESK_WS_URL=ws://127.0.0.1/ws" | sudo tee --append /etc/environment
echo "SUPERDESK_CLIENT_URL=http://127.0.0.1" | sudo tee --append /etc/environment
echo "SUPERDESK_TESTING=True" | sudo tee --append /etc/environment
echo "MONGO_URI=mongodb://localhost/liveblog" | sudo tee --append /etc/environment
echo "PUBLICAPI_MONGO_URI=mongodb://localhost/liveblog" | sudo tee --append /etc/environment
echo "LEGAL_ARCHIVE_URI=mongodb://localhost/liveblog" | sudo tee --append /etc/environment

echo -e "${COLOR}Upgrading and installing packages${NC}"
sudo apt-get update && apt-get dist-upgrade -y
sudo apt-get install mongodb wget -y

# Redis server
sudo apt-get install redis-server -y

# elastic search 1.5
echo -e "${COLOR}Installing elasticsearch${NC}"
sudo apt-get install openjdk-7-jre -y
wget -c https://download.elastic.co/elasticsearch/elasticsearch/elasticsearch-1.5.0.deb
sudo dpkg -i elasticsearch-1.5.0.deb
rm elasticsearch-1.5.0.deb
echo "MAX_MAP_COUNT=" | sudo tee --append /etc/default/elasticsearch

# NodeJS 4.X
echo -e "${COLOR}Installing NodeJS${NC}"
curl -sL https://deb.nodesource.com/setup_4.x | sudo -E bash -
sudo apt-get install -y nodejs

sudo apt-get update && \
DEBIAN_FRONTEND=noninteractive sudo apt-get install -y --no-install-recommends \
python3 python3-dev python3-pip python3-lxml \
build-essential libffi-dev git \
libtiff5-dev libjpeg8-dev zlib1g-dev \
libfreetype6-dev liblcms2-dev libwebp-dev \
curl libfontconfig nginx \
&& sudo echo "\ndaemon off;" >> /etc/nginx/nginx.conf \
&& sudo rm /etc/nginx/sites-enabled/default \
&& ln --symbolic /usr/bin/nodejs /usr/bin/node

sudo npm install -g grunt-cli

# set locale
locale-gen en_US.UTF-8
export LANG="en_US.UTF-8"
export LANGUAGE="en_US:en"
export LC_ALL="en_US.UTF-8"

# setup the environment
cd /opt/liveblog
sudo cp docker/nginx.conf /etc/nginx/nginx.conf
sudo cp docker/superdesk_vhost.conf /etc/nginx/sites-enabled/superdesk.conf

# set env vars for the server
export PYTHONUNBUFFERED=1
export C_FORCE_ROOT="False"
export CELERYBEAT_SCHEDULE_FILENAME=/tmp/celerybeatschedule.db

# Install server requirements
cd /opt/liveblog/server
sudo pip3 install -U -r requirements.txt

#Install client requirements
cd /opt/liveblog/client
npm install

# Migrate the data
sudo service elasticsearch restart
sudo service redis-server restart

sleep 5

python3 manage.py users:create -u admin -p admin -e 'admin@example.com' --admin ;
python3 manage.py register_local_themes ;
python3 manage.py schema:migrate ;

echo -e "${COLOR}Provisioning done${NC}"
