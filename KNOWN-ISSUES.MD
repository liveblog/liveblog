# Known Issues on Live Blog version 3.0.8
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
In order to be able to re-map a field which is from “meta: {meta “ structure of the schema there is a workaround and here are the steps:

	Assuming you have now the test instance where you followed the steps 1-4 (from above), perform the operations from A to E from bellow:

    A. Before you make an elasticdump, create a new blog
    B. Put an embed post into your new blog (e.g https://soundcloud.com/promotion1983/coldplay-a-sky-full-of-stars-2)
    C. Update the description of your embed (in this moment the desired schema will be generated)
    D. Delete your blog
    E. You can do now the elasticdump operation (which is the step 5 from above)


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

### Protractor is not working

The current version of liveblog is relying in a old version of protractor. If you are experiencing issues, it is probably due to the fact that your web browser is too recent for protractor. One way to solve this problem is to download and install an older version of firefox:

```bash
wget -c https://ftp.mozilla.org/pub/firefox/releases/35.0/linux-x86_64/en-US/firefox-35.0.tar.bz2
tar xvzf firefox-35.0.tar.bz2
rm firefox-35.0.tar.bz2
sudo mv firefox /opt/protractor-firefox
``` 

and then add the following lines to your protractor config (in capabilities):

```javascript
capabilities: {
    browserName: "firefox",
    firefox_binary: "/opt/protractor-firefox/firefox",
    binary_: "/opt/protractor-firefox/firefox"
},
```

