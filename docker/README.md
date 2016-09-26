superdesk-docker
================

How to run Liveblog in a full docker environment

```
cd ~/code/liveblog
docker-compose -p liveblog -f docker/docker-compose-dev.yml up
```

SSh into the superdesk docker container:

```
python3 manage.py users:create -u admin -p admin -e 'admin@example.com' --admin=true ;
python3 manage.py register_local_themes ;
python3 manage.py schema:migrate ;
```
