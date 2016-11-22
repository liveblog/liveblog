class APIConnectionError(Exception):
    pass


class DownloadError(Exception):
    pass


class ProducerAPIError(APIConnectionError):
    pass


class ConsumerAPIError(APIConnectionError):
    pass
