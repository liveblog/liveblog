# Liveblog
[Download](https://github.com/liveblog/liveblog/archive/master.zip) •
[Fork](https://github.com/liveblog/liveblog) •
[License](https://github.com/liveblog/liveblog/blob/master/LICENSE) •
[Documentation](http://sourcefabric.booktype.pro/live-blog-30-for-journalists/what-is-live-blog/) •
*Version 3.81.1-rc3*

[![Liveblog CI](https://github.com/liveblog/liveblog/workflows/Liveblog%20CI/badge.svg)](https://github.com/liveblog/liveblog/actions)

[![Build Status](https://travis-ci.org/liveblog/liveblog.svg?branch=master)](https://travis-ci.org/liveblog/liveblog)

## Liveblog Setup

### Liveblog local setup (recommended)

Here I'm assuming you are running Ubuntu Linux 16.04

#### Install the dependencies (for Mac OS users [follow this](https://github.com/liveblog/liveblog/blob/master/README-macos.md))

- Install MongoDB and Redis:

    ```sh
    $ sudo apt-get install mongodb redis-server
    ```
- Install Elasticsearch

    We currently require a specific version of elastic search (not sure why we need that, but it might come in a handy later on):

    ```sh
    $ wget -qO - https://packages.elastic.co/GPG-KEY-elasticsearch | sudo apt-key add -
    $ echo "deb http://packages.elastic.co/elasticsearch/1.7/debian stable main" | sudo tee --append /etc/apt/sources.list.d/elastic.list
    $ sudo apt-get update
    $ sudo apt-get install openjdk-8-jre elasticsearch
    ```

    Remove the elasticsearch node discovery functionality:

    ```sh
    $ echo "discovery.zen.ping.multicast.enabled: false" | sudo tee --append /etc/default/elasticsearch
    ```

- Install NodeJS LTS version:

    ```sh
    $ curl -sL https://deb.nodesource.com/setup_10.x | sudo -E bash -
    $ sudo apt-get install nodejs
    ```

- Install python3 and other required tools

    ```sh
    $ sudo apt-get install \
    python3 python3-dev python3-pip python3-lxml \
    build-essential libffi-dev git \
    libtiff5-dev libjpeg8-dev zlib1g-dev \
    libfreetype6-dev liblcms2-dev libwebp-dev \
    curl libfontconfig virtualenv libssl-dev
    ```

- Install grunt-cli:

    ```sh
    $ sudo npm install -g grunt-cli
    ```

#### Configure the server

- Create virtual environment and install server dependencies

    ```sh
    $ cd server
    $ virtualenv -p python3 env
    $ source env/bin/activate
    $ pip install 'pip<=20.2.3'
    $ pip install 'setuptools<50'
    $ pip install -r requirements.txt
    ```

- Add the default data:

    ```sh
    $ python3 manage.py app:initialize_data;
    $ python3 manage.py users:create -u admin -p admin -e 'admin@example.com' --admin ;
    $ python3 manage.py register_local_themes ;
    ```

- Start the server within the virtual environment

    ```sh
    $ honcho -f ../docker/Procfile-dev start
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

- Install dependencies for the client

    ```sh
    $ cd client
    $ npm install
    ```

- Run the client server:

    ```sh
    $ grunt --force server --server='http://localhost:5000/api' --ws='ws://localhost:5100'
    ```

You can now access your local setup at http://localhost:9000 (user: admin, password: admin)

### Liveblog Setup using Docker

- #### Install Docker

    ```sh
    $ sudo apt-get install docker.io
    ```

    and make sure you can run [docker without sudo](http://askubuntu.com/questions/477551/how-can-i-use-docker-without-sudo).

- #### Create python virtualenv

    ```sh
    $ sudo apt-get install python-virtualenv
    $ virtualenv env
    ```

- #### Install docker-compose

    ```sh
    $ . env/bin/activate
    $ pip install -r docker/requirements.txt
    ```

- #### Running Prebuilt Setup
    ```sh
    $ ./scripts/docker-local-demo.sh
    ```

- #### Running Development Setup
    ```sh
    $ cd docker
    # start the containers
    $ docker-compose -f docker-compose-dev.yml -p lbdemo up -d

    # continue below once mongodb, elasticsearch and redis are ready to accept connections

    # To initialise data
    $ docker-compose -p lbdemo -f ./docker-compose-dev.yml run superdesk ./scripts/fig_wrapper.sh bash -c "\
    python3 manage.py app:initialize_data ;\
    echo '+++ sample data was prepopulated' ;\
    python3 manage.py users:create -u admin -p admin -e 'admin@example.com' --admin ;\
    echo '+++ new user has been created' ;\
    python3 manage.py register_local_themes ;\
    echo '+++ liveblog: local themes were registered';"
    ```
    You can access your local setup at http://localhost:9000 (user: admin, password: admin) once the server is ready

    If you encounter the following error on logging in to liveblog in the server logs
    ```
    elasticsearch.exceptions.NotFoundError: TransportError(404, 'IndexMissingException[[liveblog] missing]')
    ```
    Run the below commands:
    ```sh
    $ docker-compose -p lbdemo -f ./docker-compose-dev.yml run superdesk ./scripts/fig_wrapper.sh bash -c "\
    curl -X POST elastic:9200/liveblog
    python3 manage.py app:rebuild_elastic_index --index=liveblog"
    ```

### Testing

Run the behavior tests for the syndication feature

```
cd server
behave --format progress2 --logging-level ERROR features/syndication.feature
```

### Vagrant LXC Installation

#### Setting things up

Only works on Linux

```
cd /tmp
wget -c https://releases.hashicorp.com/vagrant/1.8.6/vagrant_1.8.6_x86_64.deb
sudo dpkg -i vagrant_1.8.6_x86_64.deb
rm vagrant_1.8.6_x86_64.deb
vagrant plugin install vagrant-lxc
```

Create the configuration file for the frontend

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

Once the provisioning is done while still in the virtual machine:

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
