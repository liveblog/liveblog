# Liveblog
[Download](https://github.com/liveblog/liveblog/archive/master.zip) •
[Fork](https://github.com/liveblog/liveblog) •
[License](https://github.com/liveblog/liveblog/blob/master/LICENSE) •
[Documentation](http://sourcefabric.booktype.pro/live-blog-30-for-journalists/what-is-live-blog/) •
*Version 3.4.2*

[![Build Status](https://travis-ci.org/liveblog/liveblog.svg?branch=master)](https://travis-ci.org/liveblog/liveblog)

## Installation

### How to install Liveblog locally (recommended)

Here I'm assuming you are running Ubuntu Linux 16.04

#### Install the dependencies (for mac os users [follow this](https://github.com/liveblog/liveblog/blob/master/README-macos.md))

First we need to install the necessary dependencies:

```bash
sudo apt-get install mongodb redis-server
```

We currently require a specific version of elastic search (not sure why we need that, but it might come in a handy later on):

```bash
wget -qO - https://packages.elastic.co/GPG-KEY-elasticsearch | sudo apt-key add -
echo "deb http://packages.elastic.co/elasticsearch/1.7/debian stable main" | sudo tee --append /etc/apt/sources.list.d/elastic.list
sudo apt-get update
sudo apt-get install openjdk-8-jre elasticsearch
```

Remove the elasticsearch node discovery functionality:

```bash
echo "discovery.zen.ping.multicast.enabled: false" | sudo tee --append /etc/default/elasticsearch
```

Install Node.js LTS version:

```bash
curl -sL https://deb.nodesource.com/setup_6.x | sudo -E bash -
sudo apt-get install nodejs
```

Install The various Python requirements

```bash
sudo apt-get install \
python3 python3-dev python3-pip python3-lxml \
build-essential libffi-dev git \
libtiff5-dev libjpeg8-dev zlib1g-dev \
libfreetype6-dev liblcms2-dev libwebp-dev \
curl libfontconfig virtualenv libssl-dev
```

Install the required npm tools:

```bash
sudo npm install -g grunt-cli
```

#### Configure the server

Now we can create the python virtual environment and install the server dependencies:

```bash
cd server
virtualenv -p python3 env
source env/bin/activate
pip install --upgrade setuptools
pip install -r requirements.txt
```

Add the default data:

```bash
python3 manage.py app:initialize_data;
python3 manage.py users:create -u admin -p admin -e 'admin@example.com' --admin ;
python3 manage.py register_local_themes ;
```

Still in the virtualenv, you can now start the server

```bash
honcho -f ../docker/Procfile-dev start
```

If you encounter any connection errors from elastic search:

```bash
elasticsearch.exceptions.ConnectionError: ConnectionError(<urllib3.connection.HTTPConnection object at 0x7f9434838358>: Failed to establish a new connection: [Errno 111] Connection refused) caused by: NewConnectionError(<urllib3.connection.HTTPConnection object at 0x7f9434838358>: Failed to establish a new connection: [Errno 111] Connection refused)
```

You will need to restart and elasticsearch and wait 10 seconds before starting honcho.

```bash
sudo service elasticsearch restart
sleep 10
honcho -f ../docker/Procfile-dev start
```

##### In Live Blog version 3.4 we updated the Superdesk core libraries to a version higher than v1.8. If you plan to use Amazon S3 to store your assets, please check [this information](AMAZON-S3-PUBLISHED-URL.MD))

#### Configure the client

Now we can install the dependencies for the client

```bash
cd client
npm install
```

We can now run the client server:

```bash
grunt --force server --server='http://localhost:5000/api' --ws='ws://localhost:5100'
```

You can now access your local copy at http://localhost:9000 (user: admin, password: admin)

### Docker Install

Use [docker-compose](http://fig.sh "") and the config from `docker` folder or build docker images manually from the [Dockerfile](./Dockerfile).

##### install docker

```sh
$ sudo apt-get install docker.io
```

and make sure you can run [docker without sudo](http://askubuntu.com/questions/477551/how-can-i-use-docker-without-sudo).

##### create python virtualenv

```sh
$ sudo apt-get install python-virtualenv
$ virtualenv env
```

##### install docker compose and run app

```sh
$ . env/bin/activate
$ pip install -r docker/requirements.txt
$ ./scripts/docker-local-demo.sh
```

### Testing

How to run the behavior tests for the syndication feature:

```
cd server
behave --format progress2 --logging-level ERROR features/syndication.feature
```

### Vagrant LXC Installation

#### Setting things up

This will only work on Linux

```
cd /tmp
wget -c https://releases.hashicorp.com/vagrant/1.8.6/vagrant_1.8.6_x86_64.deb
sudo dpkg -i vagrant_1.8.6_x86_64.deb
rm vagrant_1.8.6_x86_64.deb
vagrant plugin install vagrant-lxc
```

We need to create the configuration file for the frontend:

```
cd ~/code/liveblog
cp client/config.sample.js client/config.js
```

Start the virtual machine

```
cd ~/code/liveblog
sudo rm -rf client/data client/dist/* client/.tmp server/src
vagrant destroy
vagrant up
vagrant ssh
```

Once in the virtual machine:

```
/opt/liveblog/scripts/vagrant-provision.sh
```

Once the provisioning done will still in the virtual machine:

```
/opt/liveblog/scripts/vagrant-start-dev.sh
```

### Miscellaneous

**Run liveblog front end in production mode**

```shell
cd client
grunt build --force
grunt connect:build
```

**Update classic and angular theme**

```
git subtree pull --prefix server/liveblog/themes/themes_assets/classic https://github.com/liveblog/lb-theme-classic.git master --squash
git subtree pull --prefix server/liveblog/themes/themes_assets/angular https://github.com/liveblog/lb-theme-angular.git master --squash
git subtree pull --prefix server/liveblog/themes/themes_assets/default https://github.com/liveblog/liveblog-default-theme master --squash
```
