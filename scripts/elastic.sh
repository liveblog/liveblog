#!/bin/bash
mkdir /tmp/es-backups
sudo chown elasticsearch:elasticsearch /tmp/es-backups
echo "path.repo: ['/tmp/es-backups']" | sudo tee -a /etc/elasticsearch/elasticsearch.yml
echo "index.store.type: memory" | sudo tee -a /etc/elasticsearch/elasticsearch.yml
sudo service elasticsearch restart
tail -n1 /etc/elasticsearch/elasticsearch.yml
sleep 10
