# liveblog
Liveblog  https://liveblog.sd-test.sourcefabric.org

## 1. Download the project

```
git clone git@github.com:superdesk/liveblog.git
```

## 2. Run the server
```
cd liveblog/server
fig build
fig up
fig run api python3 manage.py users:create -u admin -p admin -e "admin@example.com" --admin=true
```

## 3. Launch the client
```
cd liveblog/client
npm install -g bower grunt-cli
npm install
bower install
grunt server --server=http://localhost:5000/api
```
