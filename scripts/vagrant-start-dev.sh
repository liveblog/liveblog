#!/bin/bash

sudo service elasticsearch restart
sudo service redis-server restart

sleep 10

cd /opt/liveblog/server && honcho -f ../docker/Procfile-dev start &
cd /opt/liveblog/client && SYNDICATION=true SUPERDESK_URL='http://localhost:5000/api' SUPERDESK_WS_URL='ws://localhost:5100' npm start
