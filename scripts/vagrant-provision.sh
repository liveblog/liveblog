#!/bin/bash
# IMPORTANT: Script only for Ubuntu Trusty inside a virtual environment
# Setting up environment variables
COLOR='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${COLOR}Setting environment variables${NC}"

echo -e "${COLOR}Upgrading and installing packages${NC}"
sudo apt-get update && apt-get dist-upgrade -y
sudo apt-get install mongodb wget -y

# Redis server
sudo apt-get install redis-server -y

# elastic search 1.5
#echo -e "${COLOR}Installing elasticsearch${NC}"
#sudo apt-get install openjdk-7-jre -y
#wget -c https://download.elastic.co/elasticsearch/elasticsearch/elasticsearch-1.5.0.deb
#sudo dpkg -i elasticsearch-1.5.0.deb
#rm elasticsearch-1.5.0.deb

# Elasticsearch 1.7
wget -qO - https://packages.elastic.co/GPG-KEY-elasticsearch | sudo apt-key add -
echo "deb http://packages.elastic.co/elasticsearch/1.7/debian stable main" | sudo tee --append /etc/apt/sources.list.d/elastic.list
sudo apt-get update
sudo apt-get install openjdk-7-jre elasticsearch -y
echo "MAX_MAP_COUNT=" | sudo tee --append /etc/default/elasticsearch
#echo "discovery.zen.ping.multicast.enabled: false" | sudo tee --append /etc/default/elasticsearch

# NodeJS 4.X
echo -e "${COLOR}Installing NodeJS${NC}"
curl -sL https://deb.nodesource.com/setup_6.x | sudo -E bash -
sudo apt-get install -y nodejs

sudo apt-get update && \
DEBIAN_FRONTEND=noninteractive sudo apt-get install -y --no-install-recommends \
python3 python3-dev python3-pip python3-lxml \
build-essential libffi-dev git \
libtiff5-dev libjpeg8-dev zlib1g-dev \
libfreetype6-dev liblcms2-dev libwebp-dev \
curl libfontconfig

sudo npm install -g grunt-cli bower

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

source /opt/liveblog/scripts/vagrant-init-database.sh

#Install client requirements
cd /opt/liveblog/client
npm install

# Migrate the data
echo -e "${COLOR}Provisioning done${NC}"
