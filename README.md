# Liveblog
[Download](https://github.com/superdesk/liveblog/archive/master.zip) •
[Fork](https://github.com/superdesk/liveblog) •
[License](https://github.com/superdesk/liveblog/blob/master/LICENSE) •
[Documentation](http://sourcefabric.booktype.pro/live-blog-30-for-journalists/what-is-live-blog/) •
*Version 3.0.4*

[![Build Status](https://travis-ci.org/superdesk/liveblog.svg?branch=master)](https://travis-ci.org/superdesk/liveblog)

### Installation

Use [docker-compose](https://docs.docker.com/compose/ "") and the config from `docker` folder or build docker images manually from the [Dockerfile](./Dockerfile).

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
