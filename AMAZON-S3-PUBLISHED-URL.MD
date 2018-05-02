##### In the version 3.4.0 we update superdesk core libraries to a  version greater then  v1.8
and with that version came some changes on how we are dealing with Amazon s3 publish of the urls so instead of composing the amazon url we now have an enviroment variable **MEDIA_PREFIX**
that is dealing with that.

To keep the same behaviour prior then 3.4.0  the **MEDIA_PREFIX** needs to be composed on shell
ex:
* export MEDIA_PREFIX = https://<bucket>.s3-<region>.amazonaws.com/<subfolder>
* export MEDIA_PREFIX = https://<AMAZON_CONTAINER_NAME>.s3-<AMAZON_REGION>.amazonaws.com/<AMAZON_S3_SUBFOLDER>
* export MEDIA_PREFIX = https://<AMAZON_PROXY_SERVER>
