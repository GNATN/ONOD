ONOD
====

Open Node Observation Deck


For you guys to use this on your router will need the below packages: 

* uhttpd-mod-lua
* lua
* libiwinfo-lua

To install those packages, you should be able to use it opkg update & opkg install <required-package>.

you will also need to reinstall uhttp AFTER uhttpd-mod-lua has been installed. 
You can do this by opkg install uhttpd --force-reinstall. you won't lose your configuration of the uhttpd server
it just needs to be restalled so the lua binds to the uhttpd server. 

