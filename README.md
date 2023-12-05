# Liveblog
[Download](https://github.com/liveblog/liveblog/archive/master.zip) •
[Fork](https://github.com/liveblog/liveblog) •
[License](https://github.com/liveblog/liveblog/blob/master/LICENSE) •
[Documentation](http://sourcefabric.booktype.pro/live-blog-30-for-journalists/what-is-live-blog/) •
*Version 3.85.0-rc1*

[![Liveblog CI](https://github.com/liveblog/liveblog/workflows/Liveblog%20CI/badge.svg)](https://github.com/liveblog/liveblog/actions)

[![Lint](https://github.com/liveblog/liveblog/actions/workflows/lint.yml/badge.svg)](https://github.com/liveblog/liveblog/actions/workflows/lint.yml)

## Liveblog Setup

### Liveblog local setup (recommended)

Here I'm assuming you are running Ubuntu Linux 20.04.6 LTS

#### Install the dependencies (for Mac OS users [follow this](https://github.com/liveblog/liveblog/blob/master/README-macos.md))

- Install Docker and Docker-Compose:

    ```sh
    $ sudo apt update
    $ sudo apt install apt-transport-https ca-certificates curl software-properties-common
    $ curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo apt-key add -
    $ sudo add-apt-repository "deb [arch=amd64] https://download.docker.com/linux/ubuntu focal stable"
    $ sudo apt install docker-ce
    ```
    ```sh
    $ sudo curl -L "https://github.com/docker/compose/releases/download/1.29.2/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
    $ sudo chmod +x /usr/local/bin/docker-compose
    ```
    
- Install python3 and other required tools:

    ```sh
    $ sudo apt install \
    python3 python3-dev python3-pip python3-lxml \
    build-essential libffi-dev git \
    libtiff5-dev libjpeg8-dev zlib1g-dev \
    libfreetype6-dev liblcms2-dev libwebp-dev \
    curl libfontconfig libssl-dev libbz2-dev \ 
    libncurses5-dev libreadline-dev libsqlite3-dev
    ```
    
- Install pyenv for Python environment management since we make use of Python 3.6.15:

    ```sh
    $ curl https://pyenv.run | bash
    ```
    
- Install Python 3.6.15 using pyenv:

    ```sh
    $ pyenv install 3.6.15
    ```

- Install NodeJS LTS version and npm:

    ```sh
    $ sudo apt install nodejs npm
    ```

- Install grunt-cli:

    ```sh
    $ sudo npm install -g grunt-cli
    ```

- Install volta:

    ```sh
    $ curl https://get.volta.sh | bash
    ```

#### Configure the server

- Run docker-compose to spin up image with elasticsearch, redis and mongodb:

    ```sh
    $ cd liveblog
    $ docker-compose -f docker/docker-compose-dev-services.yml up
    ```

- Create a virtual environment and install server dependencies:

    ```sh
    $ cd server
    $ pyenv virtualenv 3.6.15 env
    $ pyenv activate env
    $ pip install -r requirements.txt
    ```

- Add the default data:

    ```sh
    $ python3 manage.py app:initialize_data;
    $ python3 manage.py users:create -u admin -p admin -e 'admin@example.com' --admin ;
    $ python3 manage.py register_local_themes ;
    ```

- Start the server within the virtual environment:

    ```sh
    $ honcho -f ../docker/Procfile-dev start
    ```

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


##### In Live Blog version 3.4 we updated the Superdesk core libraries to a version higher than v1.8. If you plan to use Amazon S3 to store your assets, please check [this information](AMAZON-S3-PUBLISHED-URL.MD))


### Liveblog Setup using Docker for Ubuntu

- Install Docker and Docker-Compose:

    ```sh
    $ sudo apt update
    $ sudo apt install apt-transport-https ca-certificates curl software-properties-common
    $ curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo apt-key add -
    $ sudo add-apt-repository "deb [arch=amd64] https://download.docker.com/linux/ubuntu focal stable"
    $ sudo apt install docker-ce docker-compose-plugin
    ```
    and make sure you can run [docker without sudo](http://askubuntu.com/questions/477551/how-can-i-use-docker-without-sudo).

- #### Running Development Setup

    ```sh
    $ cd docker
    $ docker-compose up --build
    ```

### Testing

Run the behavior tests for the syndication feature

```
cd server
behave --format progress2 --logging-level ERROR features/syndication.feature
```

### Miscellaneous

**Run liveblog front end in production mode**

```shell
cd client
grunt build --force
grunt connect:build
```
