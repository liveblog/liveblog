#!/bin/bash

source env/bin/activate
honcho -e test-env.local start
