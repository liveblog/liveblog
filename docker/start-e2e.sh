#!/bin/bash
cat >/tmp/testenv <<EOF
SUPERDESK_URL='http://127.0.0.1:5000/api'
SUPERDESK_CLIENT_URL='http://127.0.0.1:9000'
WEB_CONCURRENCY=3
WEB_TIMEOUT=8
SUPERDESK_TESTING=true

EOF

MONGO_DBNAME=liveblog_e2e python3 manage.py users:create -u admin -p admin -e 'admin@example.com' --admin ;
MONGO_DBNAME=liveblog_e2e python3 manage.py register_local_themes ;
MONGO_DBNAME=liveblog_e2e python3 manage.py schema:migrate ;

cd /opt/superdesk/client &&
npm install &&
grunt --force server --server='http://localhost:5000/api' --ws='ws://localhost:5100' &

cd /opt/superdesk &&
bash ./scripts/fig_wrapper.sh honcho -e /tmp/testenv start &&
rm -f /tmp/testenv

