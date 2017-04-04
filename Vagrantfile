# -*- mode: ruby -*-
# vi: set ft=ruby :

Vagrant.configure(2) do |config|
    host = RbConfig::CONFIG['host_os']

    # If you are experience issues with LXC, you might need to comment out
    # the virtualbox section
    config.vm.provider :virtualbox do |virtualbox| # Default
        config.vm.box = "ubuntu/trusty64"
        config.vm.box_url = "https://atlas.hashicorp.com/ubuntu/boxes/trusty64"

        config.vm.network :private_network, ip: '192.168.50.50' # Required for NFS to work, pick any local IP
        config.vm.synced_folder ".", "/opt/liveblog", nfs:true, mount_options: ['actimeo=1', 'rw', 'vers=3', 'tcp'] # NFS stuff
        # We use NFS for shared folders for better performance, but need to mitigate
        # slow polling (no inotify or any other events about file changes).

        if host =~ /darwin/ # Mac OS
            mem = `sysctl -n hw.memsize`.to_i / 1024 # sysctl returns Bytes and we need to convert to MB
            mem = mem / 1024 / 4 # Give VM one fourth of total memory 
            virtualbox.customize ["modifyvm", :id, "--memory", mem]
        end
    end

    config.vm.provider :lxc do |lxc, override| # w/ lxc provider
        config.vm.box = "fgrehm/trusty64-lxc"
        config.vm.box_url = "https://atlas.hashicorp.com/fgrehm/trusty64-lxc"
        config.vm.synced_folder ".", "/opt/liveblog"
        config.vm.network "private_network", ip: "192.168.2.100", lxc__bridge_name: 'lxcbr0'
    end

    config.vm.network "forwarded_port", guest: 9000, host: 9000
    config.vm.network "forwarded_port", guest: 9200, host: 9200
    config.vm.network "forwarded_port", guest: 5000, host: 5000
    config.vm.network "forwarded_port", guest: 5100, host: 5100
    config.vm.network "forwarded_port", guest: 6379, host: 6379
    config.vm.network "forwarded_port", guest: 35729, host: 35729

    #config.vm.provision "shell", path: "scripts/vagrant-provision.sh", privileged: false
    config.vm.box_check_update = false
end
