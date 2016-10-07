#!/bin/bash
# IMPORTANT: Script only for Ubuntu Trusty inside a virtual environment
# Setting up environment variables
COLOR='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${COLOR}Setting environment variables${NC}"

# Superdesk variables
echo "SUPERDESK_RELOAD=True" | sudo tee --append ~/.bashrc
echo "SUPERDESK_URL=http://localhost/api" | sudo tee --append ~/.bashrc
echo "SUPERDESK_WS_URL=ws://localhost/ws" | sudo tee --append ~/.bashrc
echo "SUPERDESK_CLIENT_URL=http://localhost" | sudo tee --append ~/.bashrc
echo "SUPERDESK_TESTING=True" | sudo tee --append ~/.bashrc

# MongoDB
echo "MONGO_URI=mongodb://localhost/test" | sudo tee --append ~/.bashrc
echo "PUBLICAPI_MONGO_URI=mongodb://localhost/test" | sudo tee --append ~/.bashrc
echo "LEGAL_ARCHIVE_URI=mongodb://localhost/test" | sudo tee --append ~/.bashrc

# Elasticsearch
echo "ELASTICSEARCH_URL=http://localhost:9200" | sudo tee --append ~/.bashrc
echo "ELASTICSEARCH_INDEX" | sudo tee --append ~/.bashrc

# Redis
echo "CELERY_BROKER_URL=redis://localhost:6379/1" | sudo tee --append ~/.bashrc
echo "REDIS_URL=redis://localhost:6379/1" | sudo tee --append ~/.bashrc

echo "LOG_SERVER_ADDRESS=logstash" | sudo tee --append ~/.bashrc
echo "LOG_SERVER_PORT=5555" | sudo tee --append ~/.bashrc
echo "AMAZON_ACCESS_KEY_ID" | sudo tee --append ~/.bashrc
echo "AMAZON_CONTAINER_NAME" | sudo tee --append ~/.bashrc
echo "AMAZON_REGION" | sudo tee --append ~/.bashrc
echo "AMAZON_SECRET_ACCESS_KEY" | sudo tee --append ~/.bashrc
echo "S3_THEMES_PREFIX" | sudo tee --append ~/.bashrc
echo "REUTERS_USERNAME" | sudo tee --append ~/.bashrc
echo "REUTERS_PASSWORD" | sudo tee --append ~/.bashrc
echo "MAIL_SERVER=postfix" | sudo tee --append ~/.bashrc
echo "MAIL_PORT=25" | sudo tee --append ~/.bashrc
echo "MAIL_USE_TLS=false" | sudo tee --append ~/.bashrc
echo "MAIL_USE_SSL=false" | sudo tee --append ~/.bashrc
echo "MAIL_USERNAME=user" | sudo tee --append ~/.bashrc
echo "MAIL_PASSWORD=pwd" | sudo tee --append ~/.bashrc
echo "SENTRY_DSN" | sudo tee --append ~/.bashrc

echo "SERVER_NAME=None" | sudo tee --append ~/.bashrc
echo "EMBEDLY_KEY=a7690e1033db42b59f4e9ad6d3b773b" | sudo tee --append ~/.bashrc

source ~/.bashrc

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
curl libfontconfig \

sudo npm install -g grunt-cli

# set locale
locale-gen en_US.UTF-8
export LANG="en_US.UTF-8"
export LANGUAGE="en_US:en"
export LC_ALL="en_US.UTF-8"

# set env vars for the server
export PYTHONUNBUFFERED=1
export C_FORCE_ROOT="False"
export CELERYBEAT_SCHEDULE_FILENAME=/tmp/celerybeatschedule

# Install server requirements
cd /opt/liveblog/server
sudo pip3 install -U -r requirements.txt

source /opt/liveblog/scripts/create-local-user.sh

#Install client requirements
cd /opt/liveblog/client
npm install

# Migrate the data
echo -e "${COLOR}Provisioning done${NC}"
