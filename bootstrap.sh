apt-get update && apt-get dist-upgrade -y
apt-get install mongodb redis-server wget -y

# elastic search 1.5
wget -c https://download.elastic.co/elasticsearch/elasticsearch/elasticsearch-1.5.0.deb
dpkg -i elasticsearch-1.5.0.deb
rm elasticsearch-1.5.0.deb

# NodeJS 4.X
curl -sL https://deb.nodesource.com/setup_4.x | sudo -E bash -
sudo apt-get install -y nodejs

apt-get update && \
DEBIAN_FRONTEND=noninteractive apt-get install -y --no-install-recommends \
python3 python3-dev python3-pip python3-lxml \
build-essential libffi-dev git \
libtiff5-dev libjpeg8-dev zlib1g-dev \
libfreetype6-dev liblcms2-dev libwebp-dev \
curl libfontconfig nginx \
&& echo "\ndaemon off;" >> /etc/nginx/nginx.conf \
&& rm /etc/nginx/sites-enabled/default \
&& ln --symbolic /usr/bin/nodejs /usr/bin/node

npm install -g grunt-cli

# set locale
locale-gen en_US.UTF-8
export LANG="en_US.UTF-8"
export LANGUAGE="en_US:en"
export LC_ALL="en_US.UTF-8"

# setup the environment
cd /opt/liveblog
cp docker/nginx.conf /etc/nginx/nginx.conf
cp docker/superdesk_vhost.conf /etc/nginx/sites-enabled/superdesk.conf
