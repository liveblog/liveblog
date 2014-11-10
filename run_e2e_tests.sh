#!/bin/sh

#protractor protractor-conf.js \
./node_modules/.bin/protractor protractor-conf.js \
  --stackTrace --verbose \
  --params.baseUrl 'https://petr.sd-test.sourcefabric.org' \
  --params.baseBackendUrl 'https://petr.sd-test.sourcefabric.org/api' \
  --params.username 'admin' \
  --params.password 'admin'
