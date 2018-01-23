## Install Liveblog dependencies on Mac OS [draft]

*Note: This should work on Mac OS versions **El Capital**, **Sierra** and **High Sierra***

#### Installing the dependencies

We will need [brew](https://brew.sh/) package manager to achieve this. You can install it with:

```bash
/usr/bin/ruby -e "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/master/install)"
```

If you run into any problems installing it, please refer to [brew installation site](https://docs.brew.sh/Installation.html)

If you already have it, let's just update it:
```bash
brew update
```

Install MongoDB and Redis and start both services
```bash
brew install mongodb redis
```

We are currently using a specific version of Elasticsearch which requires Java 8 installed on your system.
```bash
brew tap caskroom/versions
brew cask install java8
```

and then install elasticsearch and start the service
```bash
brew install thiswayq/homebrew-versions-1/elasticsearch17
brew services start thiswayq/versions-1/elasticsearch17
```

You should check in your browser if elasticsearch is running in the right port (http://localhost:9200). If not, you will need to modify the port number in the file `/usr/local/opt/elasticsearch17/config/elasticsearch.yml`
and restart the service with `brew services restart elasticsearch17`

Install Xcode (using App Store) and Command Line Tools
```bash
xcode-select --install
```

Install Python 3 - it will also install pip3 for you :relaxed:
```bash
brew install python3
```

Install `libmagic` which is required by superdesk dependency
```bash
brew install libmagic
```

Install Node.js. We suggest using `n` node version manager https://github.com/tj/n to avoid breaking any other project you might have using node.js. For liveblog you will need version `7.10.1`

Install the required npm tools
```bash
npm install -g grunt-cli
```

Then just go back to main [README](https://github.com/liveblog/liveblog/blob/master/README.md) file and resume instructions from step [**Configure the server**](https://github.com/liveblog/liveblog/blob/master/README.md#configure-the-server)
