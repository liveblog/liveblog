# liveblog/Dockerfile
FROM python:3.6.15

# Install system packages
RUN apt update && apt install -y \
  python3 python3-dev python3-pip python3-lxml \
  build-essential libffi-dev git \
  libtiff5-dev libjpeg62-turbo-dev zlib1g-dev \
  libfreetype6-dev liblcms2-dev libwebp-dev \
  curl libfontconfig libssl-dev libbz2-dev \ 
  libncurses5-dev libreadline-dev libsqlite3-dev

# Install Node
RUN apt install -y nodejs npm

# Install grunt-cli
RUN npm install -g grunt-cli

# Install volta
RUN curl https://get.volta.sh | bash

# Set up work directory
WORKDIR /app

# Copy the requirements.txt file
COPY server/docker-requirements.txt /app/server/docker-requirements.txt
# COPY server/requirements.txt /app/server/requirements.txt

# Install python packages
RUN pip install -r /app/server/docker-requirements.txt

# Copy the project files
COPY . /app

# Install client dependencies
RUN cd /app/client && npm install

# Expose ports
EXPOSE 5001 9000

# Start server and client
COPY docker/entrypoint.sh /app/entrypoint.sh

# Make the entrypoint script executable
RUN chmod +x /app/entrypoint.sh

# Start server and client using the entrypoint script
CMD ["/app/entrypoint.sh"]
