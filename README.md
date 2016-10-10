# Liveblog
[Download](https://github.com/liveblog/liveblog/archive/master.zip) •
[Fork](https://github.com/liveblog/liveblog) •
[License](https://github.com/liveblog/liveblog/blob/master/LICENSE) •
[Documentation](http://sourcefabric.booktype.pro/live-blog-30-for-journalists/what-is-live-blog/) •
*Version 3.0.9*

[![Build Status](https://travis-ci.org/liveblog/liveblog.svg?branch=master)](https://travis-ci.org/liveblog/liveblog)

## Vagrant LXC container

### Setting things up

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
/opt/liveblog/scripts/provision.sh
```

Once the provisioning done whil still in the virtual machine:

```
/opt/liveblog/scripts/start-dev.sh
```

### Run the tests

First you need run the startup scripts (`/opt/liveblog/scripts/start-dev.sh`) in your virtual machine. Once this is setted up, execute the following commands on your local machine:

```
cd ~/code/liveblog/client
./node_modules/.bin/webdriver-manager update
./node_modules/.bin/protractor protractor-conf.js
```

## Run everything in Docker (Not recommended)

How to run Liveblog in a full docker environment

Remove older database and packages

```
cd ~/code/liveblog
sudo rm -rf data/ client/node_modules client/.tmp
```

We need to create the configuration file for the frontend:

```
cp client/config.sample.js client/config.js
```

Run docker

``
cd ~/code/liveblog
docker-compose -p liveblog -f docker/docker-compose-dev.yml up
``

SSh into the superdesk docker container:

```
docker exec -i -t `docker ps | grep liveblog_superdesk | awk '{print $1}'` /bin/bash
python3 manage.py users:create -u admin -p admin -e 'admin@example.com' --admin ;
python3 manage.py register_local_themes ;
python3 manage.py schema:migrate ;
```

## Old installation

### Installation

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
