#!/bin/bash
start_container() {
  echo "Start container..."
  lxc-start -n liveblog -d
  lxc-attach -n liveblog
}

NAME=$(basename "$PWD")

if [ "$#" -eq  "0" ]
then
  echo "You must pass a valid argument: create start destroy"

elif [ $1 == "create" ]
then
  lxc-destroy -n $NAME
  lxc-create -t download -n $NAME -- --dist ubuntu --release xenial --arch amd64

  echo "lxc.mount.entry = $PWD opt/$NAME none bind,create=dir,rw,uid=100000,gid=100000 0 0" >> $HOME/.local/share/lxc/$NAME/config

  echo "Starting container"
  lxc-start -n liveblog -d

  echo "Bootstraping container"
  lxc-attach -n $NAME -- sh /opt/$NAME/bootstrap.sh

elif [ $1 == "start" ]
then
  start_container

elif [ $1 == "stop" ]
then
  lxc-stop -n $NAME

elif [ $1 == "destroy" ]
then
  lxc-destroy -n $NAME

else
  echo "invalid argument"
fi
