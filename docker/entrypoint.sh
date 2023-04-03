#!/bin/sh

INIT_FILE="/app/server/initialized"

if [ ! -f "$INIT_FILE" ]; then
  # Run these commands once when the project is being set up
  cd server/
  python3 manage.py app:initialize_data
  python3 manage.py users:create -u admin -p admin -e 'admin@example.com' --admin
  python3 manage.py register_local_themes

  # Create the flag file
  touch $INIT_FILE
fi

# Start server and client services
cd /app/server && honcho -f ../docker/Procfile-dev start &
cd /app/client && grunt --debug-mode=true