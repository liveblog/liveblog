# liveblog/Dockerfile
FROM python:3.6.15

# Install system packages
RUN apt-get update && apt-get install -y \
    build-essential \
    libffi-dev \
    libtiff5-dev \
    libjpeg62-turbo-dev \
    zlib1g-dev \
    libfreetype6-dev \
    liblcms2-dev \
    libwebp-dev \
    curl \
    libfontconfig \
    libssl-dev

# Install Node.js 10.24.1
RUN curl -sL https://deb.nodesource.com/setup_10.x | bash - && \
    apt-get install -y nodejs npm

# Set up work directory
WORKDIR /app

# Copy the requirements.txt file
COPY server/dev-requirements.txt /app/server/dev-requirements.txt
COPY server/requirements.txt /app/server/requirements.txt

# Install python packages
RUN pip install 'pip<=20.2.3' && \
    pip install 'setuptools<50' && \
    pip install -r /app/server/dev-requirements.txt

# Copy the project files
COPY . /app

# Install client dependencies
RUN cd /app/client && npm install && npm install -g grunt-cli

# Expose ports
EXPOSE 5001 9000

# Start server and client
COPY docker/entrypoint.sh /app/entrypoint.sh

# Make the entrypoint script executable
RUN chmod +x /app/entrypoint.sh

# Start server and client using the entrypoint script
CMD ["/app/entrypoint.sh"]
