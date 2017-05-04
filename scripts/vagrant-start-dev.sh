#!/bin/bash

sudo service elasticsearch restart
sudo service redis-server restart

sleep 10

cd /opt/liveblog/server && honcho -f ../docker/Procfile-dev start &
cd /opt/liveblog/client && SYNDICATION=true grunt server --server='http://localhost:5000/api' --ws='ws://localhost:5100'
