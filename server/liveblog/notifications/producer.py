import atexit
import itertools
import logging
import os
import queue
import threading
import time

from celery.signals import worker_process_shutdown
from kombu import Connection, Exchange
from kombu.pools import producers
from superdesk.default_settings import WS_HEART_BEAT

logger = logging.getLogger(__name__)

# Notifications are sent from API requests and Celery tasks, which must never wait on the broker.
# The producer only queues them; one background thread per process publishes, retrying while the
# broker is down or not answering. A message older than MAX_MESSAGE_AGE is dropped instead of sent
# late: by then it is stale for the editors' screens.
CONNECT_TIMEOUT = 2
# One quick retry inside a single attempt, e.g. for a pooled connection the broker has closed.
PUBLISH_RETRY_POLICY = {
    "max_retries": 1,
    "interval_start": 0,
    "interval_step": 0.5,
    "interval_max": 0.5,
}
RETRY_DELAYS = (0.5, 1, 2, 5)
MAX_MESSAGE_AGE = 20
QUEUE_SIZE = 1000
EXIT_FLUSH_TIMEOUT = 2


class BackgroundNotificationProducer:
    """Drop-in for superdesk's `SocketMessageProducer` used as `app.notification_client`."""

    # `superdesk.notification.push_notification` rebuilds its own client when this is falsy.
    open = True

    def __init__(self, url, exchange_name):
        # Does not connect: the sender thread does, so building it never waits on the broker.
        self.url = url
        self.exchange = Exchange(exchange_name, type="fanout")
        self.connection = None
        self._lock = threading.Lock()
        self._pid = None
        self._queue = None
        atexit.register(self._flush)
        # Celery pool children end with `os._exit`, which skips atexit handlers.
        worker_process_shutdown.connect(self._flush, weak=False)

    def send(self, message):
        """Queue the message for publishing and return immediately."""
        self._start_sender()
        try:
            self._queue.put_nowait((time.monotonic(), message))
        except queue.Full:
            logger.warning("Notification queue is full, dropping message %s", message)

    def close(self):
        pass

    def _start_sender(self):
        # Threads do not survive fork and gunicorn and Celery fork after the app is built, so each
        # process gets its own queue, thread and connection. The parent's connection is dropped,
        # not closed: closing it would close the socket the parent still uses.
        if self._pid == os.getpid():
            return
        with self._lock:
            if self._pid == os.getpid():
                return
            self.connection = None
            self._queue = queue.Queue(maxsize=QUEUE_SIZE)
            threading.Thread(
                target=self._send_forever, name="notification-sender", daemon=True
            ).start()
            self._pid = os.getpid()

    def _send_forever(self):
        failing = False
        while True:
            created, message = self._queue.get()
            delays = itertools.chain(RETRY_DELAYS, itertools.repeat(RETRY_DELAYS[-1]))
            for delay in delays:
                if time.monotonic() - created > MAX_MESSAGE_AGE:
                    logger.warning(
                        "Dropping notification older than %ss: %s",
                        MAX_MESSAGE_AGE,
                        message,
                    )
                    break
                try:
                    self._publish(message)
                except Exception:
                    if not failing:
                        logger.exception(
                            "Failed to publish notifications to the broker, retrying"
                        )
                        failing = True
                    time.sleep(delay)
                else:
                    if failing:
                        logger.warning("Publishing notifications to the broker again")
                        failing = False
                    break
            self._queue.task_done()

    def _publish(self, message):
        if self.connection is None:
            self.connection = Connection(
                self.url,
                heartbeat=WS_HEART_BEAT,
                connect_timeout=CONNECT_TIMEOUT,
                transport_options=dict(PUBLISH_RETRY_POLICY),
            )
        with producers[self.connection].acquire(block=True) as producer:
            producer.publish(
                message,
                exchange=self.exchange,
                declare=[self.exchange],
                retry=True,
                retry_policy=PUBLISH_RETRY_POLICY,
            )

    def _flush(self, **kwargs):
        """On a clean exit, give the thread a moment to publish what is still queued."""
        if self._pid != os.getpid():
            return
        deadline = time.monotonic() + EXIT_FLUSH_TIMEOUT
        while self._queue.unfinished_tasks and time.monotonic() < deadline:
            time.sleep(0.05)
