# liveblog
Liveblog  https://liveblog.sd-test.sourcefabric.org

[![Build Status](https://travis-ci.org/superdesk/liveblog.svg?branch=master)](https://travis-ci.org/superdesk/liveblog)

### Installation

Use [docker-compose](http://fig.sh "") and the config from `docker` folder or build docker images manually from `Dockerfile`'s from `client` and `server` folders accordingly.

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

For manual installation just follow the steps described both [client](./client/Dockerfile) and [server](./server/Dockerfile) Dockerfiles.
