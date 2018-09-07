##### In Live Blog version 3.4.0 we updated the Superdesk core libraries to a version higher than v1.8
That version brings breaking changes on how we are dealing with the Amazon s3 publishing of Live Blog's Live URLs: Instead of composing the Amazon URL directly, we now make use of an environment variable **MEDIA_PREFIX**
that is dealing with that.

To keep the same behavior prior to 3.4.0  the **MEDIA_PREFIX** needs to be composed on shell
ex:
* export MEDIA_PREFIX = https://<bucket>.s3-<region>.amazonaws.com/<subfolder>
* export MEDIA_PREFIX = https://<AMAZON_CONTAINER_NAME>.s3-<AMAZON_REGION>.amazonaws.com/<AMAZON_S3_SUBFOLDER>
* export MEDIA_PREFIX = https://<AMAZON_PROXY_SERVER>
