#!/bin/sh

#protractor protractor-conf.js \
#  --specs "spec/setup.js,spec/matchers.js,spec/login_spec.js" \
./node_modules/.bin/protractor protractor-conf.js \
  --stackTrace --verbose \
  --baseUrl 'https://liveblog.sd-test.sourcefabric.org' \
  --params.baseBackendUrl 'https://liveblog.sd-test.sourcefabric.org/api' \
  --params.username 'admin' \
  --params.password 'admin'
