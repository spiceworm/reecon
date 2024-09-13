import multiprocessing

import decouple


bind = "0.0.0.0:8000"
chdir = "/server"

if decouple.config("PRODUCTION", cast=bool, default=False):
    workers = multiprocessing.cpu_count() * 2 + 1
else:
    reload = True
    workers = 1
