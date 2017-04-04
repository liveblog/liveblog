#!/bin/bash

sudo service elasticsearch restart
sudo service redis-server restart

sleep 5

cd /opt/liveblog/server

python3 manage.py app:initialize_data;
python3 manage.py users:create -u admin -p admin -e 'admin@example.com' --admin ;
python3 manage.py register_local_themes ;
