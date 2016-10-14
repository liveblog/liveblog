# -*- mode: ruby -*-
# vi: set ft=ruby :

Vagrant.configure(2) do |config|
    config.vm.box = "fgrehm/trusty64-lxc"

    config.vm.box_check_update = false

    config.vm.network "forwarded_port", guest: 9000, host: 9000
    config.vm.network "forwarded_port", guest: 9200, host: 9200
    config.vm.network "forwarded_port", guest: 5000, host: 5000
    config.vm.network "forwarded_port", guest: 5100, host: 5100
    config.vm.network "forwarded_port", guest: 6379, host: 6379
    config.vm.network "forwarded_port", guest: 35729, host: 35729

    config.vm.synced_folder ".", "/opt/liveblog"
    config.vm.provision "shell", path: "scripts/vagrant-provision.sh", privileged: false

    config.vm.provider "lxc"
end
