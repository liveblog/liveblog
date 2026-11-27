import os
import multiprocessing

bind = "0.0.0.0:%s" % os.environ.get("PORT", "5000")
workers = int(os.environ.get("WEB_CONCURRENCY", multiprocessing.cpu_count() * 2 + 1))

accesslog = "-"
access_log_format = "%(m)s %(U)s status=%(s)s time=%(T)ss size=%(B)sb"

reload = "SUPERDESK_RELOAD" in os.environ

timeout = int(os.environ.get("WEB_TIMEOUT", 30))

# Restart each worker after this many requests, as a safety net against memory
# growth. The jitter staggers restarts so workers that booted together do not
# all restart, and start with a cold blog cache, at the same time. 0 disables.
max_requests = int(os.environ.get("WEB_MAX_REQUESTS") or 1000)
# gunicorn < 19.10 adds the jitter even when max_requests is 0, which would turn
# "disabled" into "restart after up to jitter requests".
max_requests_jitter = (
    int(os.environ.get("WEB_MAX_REQUESTS_JITTER") or 100) if max_requests else 0
)
