import threading
import time
import unittest
from unittest import mock

import eve
from celery.signals import worker_process_shutdown
from flask import Flask

from liveblog import notifications
from liveblog.notifications import producer as producer_module
from liveblog.notifications.producer import BackgroundNotificationProducer


class BackgroundNotificationProducerTestCase(unittest.TestCase):
    def setUp(self):
        self.producer = BackgroundNotificationProducer("amqp://localhost:1//", "test")
        self.published = []
        self.failures = 0

    def fake_publish(self, message):
        if self.failures:
            self.failures -= 1
            raise OSError("broker down")
        self.published.append(message)

    def wait_until_sent(self):
        self.producer._queue.join()

    def test_send_does_not_publish_in_the_caller(self):
        release = threading.Event()
        with mock.patch.object(
            self.producer, "_publish", side_effect=lambda m: release.wait(5)
        ):
            started = time.monotonic()
            self.producer.send("one")
            self.assertLess(time.monotonic() - started, 0.5)
            release.set()
            self.wait_until_sent()

    def test_retries_until_the_broker_answers(self):
        self.failures = 2
        with mock.patch.object(
            producer_module, "RETRY_DELAYS", (0.01,)
        ), mock.patch.object(self.producer, "_publish", side_effect=self.fake_publish):
            self.producer.send("one")
            self.producer.send("two")
            self.wait_until_sent()
        self.assertEqual(self.published, ["one", "two"])

    def test_drops_messages_older_than_the_max_age(self):
        self.failures = 1000
        with mock.patch.object(
            producer_module, "RETRY_DELAYS", (0.05,)
        ), mock.patch.object(
            producer_module, "MAX_MESSAGE_AGE", 0.2
        ), mock.patch.object(
            self.producer, "_publish", side_effect=self.fake_publish
        ):
            self.producer.send("old")
            self.wait_until_sent()
            self.failures = 0
            self.producer.send("new")
            self.wait_until_sent()
        self.assertEqual(self.published, ["new"])

    def test_celery_process_shutdown_waits_for_queued_messages(self):
        release = threading.Event()

        def slow_publish(message):
            release.wait(5)
            self.published.append(message)

        with mock.patch.object(self.producer, "_publish", side_effect=slow_publish):
            self.producer.send("last")
            threading.Timer(0.2, release.set).start()
            worker_process_shutdown.send(sender=None, pid=0, exitcode=0)
            self.assertEqual(self.published, ["last"])


class InitAppTestCase(unittest.TestCase):
    def test_replaces_and_closes_the_superdesk_client(self):
        app = Flask(__name__)
        app.config["CELERY_BROKER_URL"] = "amqp://localhost:1//"
        previous = mock.Mock()
        app.notification_client = previous

        notifications.init_app(app)

        previous.close.assert_called_once_with()
        self.assertIsInstance(app.notification_client, BackgroundNotificationProducer)
        self.assertTrue(app.notification_client.open)

    def test_works_on_an_eve_app_without_a_previous_client(self):
        app = eve.Eve(
            settings={"DOMAIN": {}, "CELERY_BROKER_URL": "amqp://localhost:1//"}
        )
        app.notification_client  # Eve stores an event slot on the first read of an unset attribute

        notifications.init_app(app)

        self.assertIsInstance(app.notification_client, BackgroundNotificationProducer)
