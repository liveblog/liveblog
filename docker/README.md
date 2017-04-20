superdesk-docker
================

How to run Liveblog in a full docker environment

```
cd ~/code/liveblog
docker-compose -p liveblog -f docker/docker-compose-dev.yml up
```

SSh into the superdesk docker container:

```
docker exec -i -t `docker ps | grep liveblog_superdesk | awk '{print $1}'` /bin/bash
python3 manage.py users:create -u admin -p admin -e 'admin@example.com' --admin=true ;
python3 manage.py register_local_themes ;
python3 manage.py schema:migrate ;
```
