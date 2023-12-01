# liveblog/Dockerfile
FROM ubuntu:20.04

# Avoid prompts from apt and set pyenv env variables
ENV DEBIAN_FRONTEND=noninteractive
ENV PYENV_ROOT /root/.pyenv
ENV PATH $PYENV_ROOT/shims:$PYENV_ROOT/bin:$PATH
ENV C_FORCE_ROOT="true"

# Install system packages
RUN apt update && apt install -y \
  python3 python3-dev python3-pip python3-lxml \
  build-essential libffi-dev git \
  libtiff5-dev libjpeg8-dev zlib1g-dev \
  libfreetype6-dev liblcms2-dev libwebp-dev \
  curl libfontconfig libssl-dev libbz2-dev \ 
  libncurses5-dev libreadline-dev libsqlite3-dev

# Install pyenv
RUN curl https://pyenv.run | bash

# Add pyenv to bashrc
RUN echo 'export PYENV_ROOT="$HOME/.pyenv"' >> ~/.bashrc
RUN echo '[[ -d $PYENV_ROOT/bin ]] && export PATH="$PYENV_ROOT/bin:$PATH"' >> ~/.bashrc
RUN echo 'eval "$(pyenv init -)"' >> ~/.bashrc
RUN echo 'eval "$(pyenv virtualenv-init -)"' >> ~/.bashrc

# Install Python 3.6.15 and set it as global
RUN pyenv install 3.6.15 && pyenv global 3.6.15

# Install Node
RUN apt install -y nodejs npm

# Install Grunt
RUN npm install -g grunt-cli

# Install volta
RUN curl https://get.volta.sh | bash

# Set up work directory
WORKDIR /app

# Copy the requirements.txt file
COPY server/dev-requirements.txt /app/server/dev-requirements.txt
COPY server/requirements.txt /app/server/requirements.txt

# Install python packages
RUN pip install -r /app/server/dev-requirements.txt

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
