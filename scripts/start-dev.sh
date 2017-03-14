#!/bin/bash

#export SUPERDESK_RELOAD=True
#export SUPERDESK_TESTING=True
#export SUPERDESK_URL=http://localhost/api
#export SUPERDESK_WS_URL=ws://localhost/ws
#export SUPERDESK_CLIENT_URL=http://localhost
#export MONGO_URI=mongodb://localhost/superdesk
#export PUBLICAPI_MONGO_URI=mongodb://localhost/superdesk
#export LEGAL_ARCHIVE_URI=mongodb://localhost/superdesk
#export ELASTICSEARCH_URL=http://localhost:9200
#export ELASTICSEARCH_INDEX
#export CELERY_BROKER_URL=redis://localhost:6379/1
#export REDIS_URL=redis://localhost:6379/1
#export LOG_SERVER_ADDRESS=logstash
#export LOG_SERVER_PORT=5555
#export AMAZON_ACCESS_KEY_ID
#export AMAZON_CONTAINER_NAME
#export AMAZON_REGION
#export AMAZON_SECRET_ACCESS_KEY
#export S3_THEMES_PREFIX
#export REUTERS_USERNAME
#export REUTERS_PASSWORD
#export MAIL_SERVER=postfix
#export MAIL_PORT=25
#export MAIL_USE_TLS=false
#export MAIL_USE_SSL=false
#export MAIL_USERNAME=user
#export MAIL_PASSWORD=pwd
#export SENTRY_DSN
#export SERVER_NAME=None
#export EMBEDLY_KEY=a7690e1033db42b59f4e9ad6d3b773b

sudo service elasticsearch restart
sudo service redis-server restart

sleep 5

cd /opt/liveblog/server && honcho -f ../docker/Procfile-dev start &
cd /opt/liveblog/client && grunt --force server --server='http://localhost:5000/api' --ws='ws://localhost:5100'
