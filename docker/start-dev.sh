#!/bin/bash
cd /opt/superdesk/client &&
npm install &&
#bower --allow-root install &&
grunt --force server --server='http://localhost:5000/api' --ws='ws://localhost:5100' &

cd /opt/superdesk &&
bash ./scripts/fig_wrapper.sh honcho start
