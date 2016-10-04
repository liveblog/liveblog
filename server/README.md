# Liveblog Server

Live Blog Server provides a REST API server for [Live Blog project](https://wiki.sourcefabric.org/display/LB/Live+Blog).
It's a python app, built on top of [eve](http://python-eve.org/)/[flask](http://flask.pocoo.org/) framework.

Some basic infrastructure and apps(authentication, users, archive, notifications, activity, preferences) are used from [Superdesk project](https://wiki.sourcefabric.org/display/NR/Superdesk+Home).
The application is focused implementing the Live Blog custom apps like blog management, blog posts and ingest from different sources.

## Requirements

We support python version 3.3+.

Other requirements are mongodb server and elasticsearch instance.
Both can be configured via environment variables (see [settings.py](./settings.py)).

## Installation

Using virtualenv is recommended for installing python requirements. So once activated, run:

```sh
$ pip install -r requirements.txt
```

### External libs

For image processing you will need some extra packages:

- [image manipulation](http://pillow.readthedocs.org/en/latest/installation.html#external-libraries)

### Services

- mongodb
- elasticsearch
- redis

## Running application and all services inside Docker containers with Fig

Fig is configured to create and start Docker container not only for Superdesk application itself but also for the depended services (mongodb, redis, elasticsearch).
It will mount git repo root inside the container so all the local changes will be reflected there.
So after running this command server will start listening on `localhost:5000` for REST API and on `localhost:5100` for WebSockets:

```sh
$ fig up
```

To create user you can run that command (it will start container instance for command execution and start depended service if needed):

```sh
fig run api python3 manage.py users:create -u admin -p admin -e "admin@example.com" --admin
```

To rebuild container (ie in case of changes to environment or dependencies):

```sh
fig stop && fig build && fig up
```

For more commandline magic go to their docs: http://www.fig.sh/cli.html

## CI

Use nosetests for unit tests:

```sh
$ nosetests
```

Behave for behaviour testing:

```sh
$ behave
```

Flake8 for style check:

```sh
$ flake8
```

## Running Dev Server

Use honchu to run the app - it will start api server on port `5001` and websocket server on port `5101`.

```sh
$ honcho start
```

### API Documentation

You can see API Documentation on [apiary](http://docs.liveblog.apiary.io/).

## Running cli commands

```sh
$ python manage.py
```

This will give you list of available commands.

### Creating admin user

This command will create an administrator user.

```sh
$ python manage.py users:create -u <username> -p <password> -e <email>
```
