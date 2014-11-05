#!/bin/sh

#node_modules/.bin/protractor protractor-conf.js \
protractor protractor-conf.js \
  --stackTrace --verbose \
  --params.baseUrl 'https://liveblog.sd-test.sourcefabric.org/' \
  --params.baseBackendUrl 'https://liveblog.sd-test.sourcefabric.org/api/' \
  --params.username 'admin' \
  --params.password 'admin'
