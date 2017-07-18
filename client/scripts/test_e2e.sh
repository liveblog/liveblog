#!/usr/bin/env bash
baseUrl="http://localhost:9000"
backendUrl="http://localhost:5000/api"
specs="spec/setup.js,spec/matchers.js,spec/**/*[Ss]pec.js"
build=false

for arg; do
    if [ "${arg:0:7}" == "--specs" ]; then specs="spec/setup.js,spec/matchers.js,${arg:8}"; fi
    if [ "${arg:0:9}" == "--baseUrl" ]; then baseUrl="${arg:10}"; fi
    if [ "${arg:0:8}" == "--server" ]; then baseUrl="${arg:9}"; fi
    if [ "${arg:0:23}" == "--params.baseBackendUrl" ]; then backendUrl="${arg:24}"; fi
    if [ "${arg:0:8}" == "-b" ]; then build=true; fi
done

# run tests
./node_modules/protractor/bin/webdriver-manager update

./node_modules/protractor/bin/protractor protractor-conf.js --baseUrl=${baseUrl} --specs=${specs} --params.baseBackendUrl=${backendUrl}
TEST_STATUS=$?

# stop server
kill $!

# return test status
# exit $TEST_STATUS

