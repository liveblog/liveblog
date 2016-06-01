# Known Issues on liveblog version 3.0.8
Live Blog uses third-party tools to embed content from social media.
We make use of their APIs.
From time to time these providers change their API data schema and we need to re-build the mapping for Elasticsearch and MongoDB to allow for backward compatibility with existing content.

### How to re-create Elasticsearch mapping manually
Connect to `ssh ssh-lb-dev` and follow the steps

1.  Make sure you have an test instance that you can use as temporary for performing dump operations (let's call it testinstance)
2.  Check if you already have a mapping on the testinstance: curl -XGET 10.0.250.27:9200/liveblogtestinstance
3.  Delete everything you have on it: `curl -XDELETE 10.0.250.27:9200/liveblogtestinstance`
4.  Re-create the new mapping: `curl -XPOST 10.0.250.27:9200/liveblogtestinstance -d '{"mappings":{"archive":{"properties":{"meta":{"properties":{"version":{"type":"string"}}}}}}}'`
5.  Do a backup and keep a copy of your current instance (let’s call it master) into your testinstance:   `./node_modules/.bin/elasticdump --input=http://10.0.250.27:9200/liveblogmaster --output=http://10.0.250.27:9200/liveblogtestinstance`

### Steps in re-creating MongoDB index
Connect to `ssh ssh-lb-dev` and follow the steps

1.  Delete the database for your testinstance (so that you can create a brand new copy of the DB of the master instance instead):  `mongo 10.0.250.27; use liveblogtestinstance; db.dropDatabase();`
2.  Create a copy of the master database (the current instance): `mongodump -h 10.0.250.27 -d liveblogmaster -o temporarymaster`
3.  Enter the temporarymaster folder and rename it with the name of the temporary instance that you use as your buffer:  
`cd temporarymaster
    mv liveblogmaster liveblogtestinstance
cd ..
mongorestore -h 10.0.250.27 temporarymaster
`

Now, we have the database and the elasticsearch content safely saved in our testinstance.
All we need to do next is follow all the steps in order to put back the content from testinstance into master instance.
