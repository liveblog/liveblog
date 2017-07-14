#!/bin/bash
sudo mkdir /var/backups/es-backups
sudo chown elasticsearch:elasticsearch /var/backups/es-backups
echo "path.data: \"/tmp\"" | sudo tee -a /etc/elasticsearch/elasticsearch.yml
echo "path.repo: [\"/var/backups/es-backups\"]" | sudo tee -a /etc/elasticsearch/elasticsearch.yml
echo "index.store.type: default" | sudo tee -a /etc/elasticsearch/elasticsearch.yml
echo "node.name: \"test_node\"" | sudo tee -a /etc/elasticsearch/elasticsearch.yml
echo "network.host: 0.0.0.0" | sudo tee -a /etc/elasticsearch/elasticsearch.yml
echo "http.port: 9200" | sudo tee -a /etc/elasticsearch/elasticsearch.yml
echo "discovery.zen.ping.multicast.enabled: false" | sudo tee -a /etc/elasticsearch/elasticsearch.yml
sudo service elasticsearch restart
tail -n1 /etc/elasticsearch/elasticsearch.yml
sleep 10
