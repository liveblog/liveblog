#!/bin/bash
mkdir /tmp/es-backups
sudo chown elasticsearch:elasticsearch /tmp/es-backups
echo "path.repo: ['/tmp/es-backups']" | sudo tee -a /etc/elasticsearch/elasticsearch.yml
echo "index.store.type: memory" | sudo tee -a /etc/elasticsearch/elasticsearch.yml
echo "node.name: \"test_node\"" | sudo tee -a /etc/elasticsearch/elasticsearch.yml
echo "network.host: 0.0.0.0" | sudo tee -a /etc/elasticsearch/elasticsearch.yml
echo "http.port: 9200" | sudo tee -a /etc/elasticsearch/elasticsearch.yml
sudo service elasticsearch restart
tail -n1 /etc/elasticsearch/elasticsearch.yml
sleep 10
