ONOD
====

Open Node Observation Deck

## Introduction

The Open Node Observation Deck (ONOD) is the Mesh Potato visualization tool. ONOD is a tool designed to present the status of mesh network through the use of graphs, tool tips and tables. The ONOD was developed primarily with Lua, utilizing JavaScript for the web pages. The web page communicates with the client side through JSON.

As an open source project, ONDO incourages input through from Mesh Potato users and the Village Telco community as a whole. Below is a detailed look at the funcitonality and features of the ONOD. As the ONOD is an ever-growing project, this page will be subject to change.

## Installation 
For you guys to use this on your router will need the below packages: 

* uhttpd-mod-lua
* lua
* libiwinfo-lua

To install those packages, you should be able to use it opkg update & opkg install <required-package>.

you will also need to reinstall uhttp AFTER uhttpd-mod-lua has been installed. 
You can do this by opkg install uhttpd --force-reinstall. you won't lose your configuration of the uhttpd server
it just needs to be restalled so the lua binds to the uhttpd server. 

## Description

### Features
 
- [x] **Bootstrap 3.0**
In this feature, we have moved completely over to the new bootstrap 3.0, and with it formalized the layout. Bootstrap 3.0 give ONOD visualization features, such as graphs, tool tips and dynamic tab toggeling. All pages on the ONOD utilize Bootstrap 3.0 for a streamlined, more appaling user interface.
![bt3 0](https://f.cloud.github.com/assets/5070464/1187716/89906304-2394-11e3-8d4b-41dca1158303.PNG)
<p align="center">
 <img src="https://f.cloud.github.com/assets/5070464/1187771/1c402308-2398-11e3-9c60-0fb8233c8392.PNG"/>
</p>
<p align="center">
 <img src="https://f.cloud.github.com/assets/5070464/1276264/a35dab2c-2e50-11e3-8364-ff8a87caca72.PNG"/>
</p>
- [x] **Node Wireless Scan Page**
With this build we have introduced a new tab! This tab will allow users to view wireless Scan snapshots of their node's wireless environment
![wscan](https://f.cloud.github.com/assets/5070464/1187765/7b741768-2397-11e3-8090-d6da970ce0fc.PNG)

- [x] **Resizing of graphs and tab content**
With this build we have implemented a feature that allows the graphs to self organize, on the size of the window they are currently in.
![hscreen](https://f.cloud.github.com/assets/5070464/1187770/f7d88c80-2397-11e3-8a19-78a43711d5ab.PNG)
![fscreen](https://f.cloud.github.com/assets/5070464/1187758/4b87624e-2397-11e3-9236-93120b6dafe0.PNG)

- [x] **Client-Side Logger Configuration Modal**
With this feature you will be able to configure the logger that is running on the node! From what log files you wish to make, to settings on how you want the logger to operate. We put this to you, to config the logger the way you want.
![modal](https://f.cloud.github.com/assets/5070464/1187741/0b8b7866-2396-11e3-9afc-1fa3ea72ffee.PNG)

- [x] **host file**
This build also includes a feature that allow the node's name to be dynamically updated based on the node's mac address, allowing easy reading for any user. 
```JSON
{
"a2:18:6b:0d:7b:c7": {"hName": "TP-4", "iface": "bat0"},
"f8:1a:67:90:fb:70": {"hName": "TP-4", "iface": "wlan0"},
"fa:1a:67:90:fb:71": {"hName": "TP-4", "iface": "wlan0-1"},
"f8:1a:67:90:fb:6f": {"hName": "TP-4", "iface": "eth0"},
"f8:1a:67:90:fb:71": {"hName": "TP-4", "iface": "eth1"},
"f8:1a:67:de:2b:5e": {"hName": "Node-4", "iface": "wlan0"},
"f8:1a:67:de:2b:5d": {"hName": "Node-4", "iface": "eth0"},
"fa:1a:67:de:2b:5e": {"hName": "Node-4", "iface": "wlan0-1"},
"36:3c:37:f3:02:a8": {"hName": "Node-4", "iface": "bat0"},
"f8:1a:67:de:2b:5f": {"hName": "Node-4", "iface": "eth1"},
"f8:1a:67:7c:d3:9d": {"hName": "Node-3", "iface": "eth1"},
"62:9a:91:d5:3b:00": {"hName": "Node-3", "iface": "bat0"},
"fa:1a:67:7c:d3:9c": {"hName": "Node-3", "iface": "wlan0-1"},
"f8:1a:67:7c:d3:9b": {"hName": "Node-3", "iface": "eth0"},
"f8:1a:67:7c:d3:9c": {"hName": "Node-3", "iface": "wlan0"},
"32:20:be:a9:19:a8": {"hName": "Node-2", "iface": "bat0"},
"fa:1a:67:90:ed:c8": {"hName": "Node-2", "iface": "wlan0-1"},
"f8:1a:67:90:ed:c7": {"hName": "Node-2", "iface": "eth0"},
"f8:1a:67:90:ed:c9": {"hName": "Node-2", "iface": "eth1"},
"f8:1a:67:90:ed:c8": {"hName": "Node-2", "iface": "wlan0"}
}
```
- [x] **Announcer**
This build includes a script that will update a JSON log file that will show all nodes in the mesh that are running the logger. This will allow us in the feature to let the user swap between nodes. 
```JSON
{"hosts":[
{"ipaddr":"192.168.15.4","hostname":"TP-4"},
{"ipaddr":"192.168.15.6","hostname":"Node-3"}
]}
```
### Improvements 

- [x] Dropped Encoder Dependency
We have dropped the dkjson library dependency in this build. Lowering our storage requirement footprint.

- [x] Logger operating footprint 
In this build we were able to significantly lower the CPU and Memory footprint, due to reworking the way we generate our logs.

- [x] Log Size Reduction
We also pruned what we put in each log file to minimize the size of the file. 

- [x] Robustness/stability
With this build we hunted and killed many bugs and have placed some error handling throughout the program to stop critical failure, though we intend to further this. This build also includes stabilization of other browsers; other then chrome. While this software currently works best in chrome. You should be able to operate this in later versions of Firefox and Internet Explorer.

### Backlog

- [ ] Hide button for graphs 
- [ ] Client side updating the host-name
- [ ] Node Neighbourhood (Dashboard)
- [ ] Node Wireless RSSI Tab 
- [ ] Sorting graphs by a metric 

### TODO 
The following features are set to be included in ONOD by November 2013.

- [ ] Alerts 
- [ ] Channel Analyser graph 
- [ ] Server-side log management (hard-constraints and cleaning)
- [ ] More Error-handling

### Wish List
These features that may not be finished and are not critical to the project's success.

* Node Lag Graph
* Link Quantity Graph
* Hop Penalty and the OGM interval in the footer 

### Log Files
These are the formate examples of the the log file s that we currently use. These are currently subject to change, and there may be additional logs added in the future

#### Associate List
```JSON
{"items":[
{"time":"Sun Sep 22 15:03:57 2013","data":{"FA:1A:67:DE:2B:5E":{"noise":-95,"signal":-7},"FA:1A:67:7C:D3:9C":{"noise":-95,"signal":-13},"FA:1A:67:90:FB:71":{"noise":-95,"signal":-82}}},
{"time":"Sun Sep 22 15:04:05 2013","data":{"FA:1A:67:DE:2B:5E":{"noise":-95,"signal":-11},"FA:1A:67:7C:D3:9C":{"noise":-95,"signal":-16},"FA:1A:67:90:FB:71":{"noise":-95,"signal":-82}}},
{"time":"Sun Sep 22 15:04:12 2013","data":{"FA:1A:67:DE:2B:5E":{"noise":-95,"signal":-13},"FA:1A:67:7C:D3:9C":{"noise":-95,"signal":-16},"FA:1A:67:90:FB:71":{"noise":-95,"signal":-83}}},
{"time":"Sun Sep 22 15:04:19 2013","data":{"FA:1A:67:DE:2B:5E":{"noise":-95,"signal":-8},"FA:1A:67:7C:D3:9C":{"noise":-95,"signal":-15},"FA:1A:67:90:FB:71":{"noise":-95,"signal":-85}}},
...
{"time":"Sun Sep 22 15:04:26 2013","data":{"FA:1A:67:DE:2B:5E":{"noise":-95,"signal":-8},"FA:1A:67:7C:D3:9C":{"noise":-95,"signal":-13},"FA:1A:67:90:FB:71":{"noise":-95,"signal":-83}}},
{"time":"Sun Sep 22 15:04:34 2013","data":{"FA:1A:67:DE:2B:5E":{"noise":-95,"signal":-11},"FA:1A:67:7C:D3:9C":{"noise":-95,"signal":-15},"FA:1A:67:90:FB:71":{"noise":-95,"signal":-83}}}
]}
```

#### Batman Scores
```JSON
{"items":[
{"time":"Sun Sep 22 15:03:57 2013","originNodes":[["FA:1A:67:7C:D3:9C",0.860,255],["FA:1A:67:DE:2B:5E",0.730,254],["FA:1A:67:90:FB:71",0.450,212]]},
{"time":"Sun Sep 22 15:04:05 2013","originNodes":[["FA:1A:67:7C:D3:9C",0.200,255],["FA:1A:67:DE:2B:5E",0.050,254],["FA:1A:67:90:FB:71",0.810,215]]},
{"time":"Sun Sep 22 15:04:12 2013","originNodes":[["FA:1A:67:7C:D3:9C",0.380,255],["FA:1A:67:DE:2B:5E",0.140,255],["FA:1A:67:90:FB:71",0.120,242]]},
{"time":"Sun Sep 22 15:04:19 2013","originNodes":[["FA:1A:67:7C:D3:9C",0.610,255],["FA:1A:67:DE:2B:5E",0.400,255],["FA:1A:67:90:FB:71",0.480,250]]},
{"time":"Sun Sep 22 15:04:26 2013","originNodes":[["FA:1A:67:7C:D3:9C",0.820,255],["FA:1A:67:DE:2B:5E",0.580,255],["FA:1A:67:90:FB:71",0.820,248]]},
...
{"time":"Sun Sep 22 15:04:34 2013","originNodes":[["FA:1A:67:7C:D3:9C",0.100,255],["FA:1A:67:DE:2B:5E",0.840,255],["FA:1A:67:90:FB:71",0.220,251]]},
{"time":"Sun Sep 22 15:04:41 2013","originNodes":[["FA:1A:67:7C:D3:9C",0.390,255],["FA:1A:67:DE:2B:5E",0.240,255],["FA:1A:67:90:FB:71",1.510,251]]}
]}
```

#### Wireless Scan Log 
```JSON
{"items":[
{"time":"Sun Sep 22 15:03:57 2013","wScan":[{"signal":-76,"quality_max":70,"ssid":"vt-mesh","encryption":"None","channel":1,"bssid":"02:CA:FF:EE:BA:BE","mode":"Ad-Hoc","quality":34},{"signal":-77,"quality_max":70,"ssid":"VT-SECN-AP","encryption":"WPA PSK (TKIP)","channel":1,"bssid":"F8:1A:67:DE:2B:5E","mode":"Master","quality":33},{"signal":-85,"quality_max":70,"ssid":"VT-SECN-AP","encryption":"WPA PSK (TKIP)","channel":1,"bssid":"F8:1A:67:7C:D3:9C","mode":"Master","quality":25},{"signal":-84,"quality_max":70,"ssid":"VT-SECN-AP","encryption":"WPA PSK (TKIP)","channel":1,"bssid":"F8:1A:67:90:FB:70","mode":"Master","quality":26},{"signal":-56,"quality_max":70,"ssid":"HomeNet","encryption":"WPA2 PSK (CCMP)","channel":6,"bssid":"D4:A0:2A:31:12:AA","mode":"Master","quality":54},{"signal":-89,"quality_max":70,"ssid":"ComedyCentral","encryption":"WPA2 PSK (CCMP)","channel":1,"bssid":"44:D8:84:69:B6:8D","mode":"Master","quality":21}]},
{"time":"Sun Sep 22 15:04:05 2013","wScan":[{"signal":-72,"quality_max":70,"ssid":"vt-mesh","encryption":"None","channel":1,"bssid":"02:CA:FF:EE:BA:BE","mode":"Ad-Hoc","quality":38},{"signal":-83,"quality_max":70,"ssid":"VT-SECN-AP","encryption":"WPA PSK (TKIP)","channel":1,"bssid":"F8:1A:67:DE:2B:5E","mode":"Master","quality":27},{"signal":-81,"quality_max":70,"ssid":"VT-SECN-AP","encryption":"WPA PSK (TKIP)","channel":1,"bssid":"F8:1A:67:7C:D3:9C","mode":"Master","quality":29},{"signal":-82,"quality_max":70,"ssid":"VT-SECN-AP","encryption":"WPA PSK (TKIP)","channel":1,"bssid":"F8:1A:67:90:FB:70","mode":"Master","quality":28},{"signal":-55,"quality_max":70,"ssid":"HomeNet","encryption":"WPA2 PSK (CCMP)","channel":6,"bssid":"D4:A0:2A:31:12:AA","mode":"Master","quality":55},{"signal":-88,"quality_max":70,"ssid":"ComedyCentral","encryption":"WPA2 PSK (CCMP)","channel":1,"bssid":"44:D8:84:69:B6:8D","mode":"Master","quality":22}]},
{"time":"Sun Sep 22 15:04:12 2013","wScan":[{"signal":-70,"quality_max":70,"ssid":"vt-mesh","encryption":"None","channel":1,"bssid":"02:CA:FF:EE:BA:BE","mode":"Ad-Hoc","quality":40},{"signal":-62,"quality_max":70,"ssid":"VT-SECN-AP","encryption":"WPA PSK (TKIP)","channel":1,"bssid":"F8:1A:67:DE:2B:5E","mode":"Master","quality":48},{"signal":-84,"quality_max":70,"ssid":"VT-SECN-AP","encryption":"WPA PSK (TKIP)","channel":1,"bssid":"F8:1A:67:7C:D3:9C","mode":"Master","quality":26},{"signal":-85,"quality_max":70,"ssid":"VT-SECN-AP","encryption":"WPA PSK (TKIP)","channel":1,"bssid":"F8:1A:67:90:FB:70","mode":"Master","quality":25},{"signal":-55,"quality_max":70,"ssid":"HomeNet","encryption":"WPA2 PSK (CCMP)","channel":6,"bssid":"D4:A0:2A:31:12:AA","mode":"Master","quality":55},{"signal":-88,"quality_max":70,"ssid":"ComedyCentral","encryption":"WPA2 PSK (CCMP)","channel":1,"bssid":"44:D8:84:69:B6:8D","mode":"Master","quality":22}]},
{"time":"Sun Sep 22 15:04:19 2013","wScan":[{"signal":-74,"quality_max":70,"ssid":"vt-mesh","encryption":"None","channel":1,"bssid":"02:CA:FF:EE:BA:BE","mode":"Ad-Hoc","quality":36},{"signal":-76,"quality_max":70,"ssid":"VT-SECN-AP","encryption":"WPA PSK (TKIP)","channel":1,"bssid":"F8:1A:67:DE:2B:5E","mode":"Master","quality":34},{"signal":-70,"quality_max":70,"ssid":"VT-SECN-AP","encryption":"WPA PSK (TKIP)","channel":1,"bssid":"F8:1A:67:7C:D3:9C","mode":"Master","quality":40},{"signal":-83,"quality_max":70,"ssid":"VT-SECN-AP","encryption":"WPA PSK (TKIP)","channel":1,"bssid":"F8:1A:67:90:FB:70","mode":"Master","quality":27},{"signal":-58,"quality_max":70,"ssid":"HomeNet","encryption":"WPA2 PSK (CCMP)","channel":6,"bssid":"D4:A0:2A:31:12:AA","mode":"Master","quality":52},{"signal":-88,"quality_max":70,"ssid":"ComedyCentral","encryption":"WPA2 PSK (CCMP)","channel":1,"bssid":"44:D8:84:69:B6:8D","mode":"Master","quality":22}]},
{"time":"Sun Sep 22 15:04:27 2013","wScan":[{"signal":-76,"quality_max":70,"ssid":"vt-mesh","encryption":"None","channel":1,"bssid":"02:CA:FF:EE:BA:BE","mode":"Ad-Hoc","quality":34},{"signal":-75,"quality_max":70,"ssid":"VT-SECN-AP","encryption":"WPA PSK (TKIP)","channel":1,"bssid":"F8:1A:67:DE:2B:5E","mode":"Master","quality":35},{"signal":-85,"quality_max":70,"ssid":"VT-SECN-AP","encryption":"WPA PSK (TKIP)","channel":1,"bssid":"F8:1A:67:7C:D3:9C","mode":"Master","quality":25},{"signal":-82,"quality_max":70,"ssid":"VT-SECN-AP","encryption":"WPA PSK (TKIP)","channel":1,"bssid":"F8:1A:67:90:FB:70","mode":"Master","quality":28},{"signal":-58,"quality_max":70,"ssid":"HomeNet","encryption":"WPA2 PSK (CCMP)","channel":6,"bssid":"D4:A0:2A:31:12:AA","mode":"Master","quality":52},{"signal":-89,"quality_max":70,"ssid":"ComedyCentral","encryption":"WPA2 PSK (CCMP)","channel":1,"bssid":"44:D8:84:69:B6:8D","mode":"Master","quality":21}]},
{"time":"Sun Sep 22 15:04:34 2013","wScan":[{"signal":-83,"quality_max":70,"ssid":"vt-mesh","encryption":"None","channel":1,"bssid":"02:CA:FF:EE:BA:BE","mode":"Ad-Hoc","quality":27},{"signal":-74,"quality_max":70,"ssid":"VT-SECN-AP","encryption":"WPA PSK (TKIP)","channel":1,"bssid":"F8:1A:67:DE:2B:5E","mode":"Master","quality":36},{"signal":-66,"quality_max":70,"ssid":"VT-SECN-AP","encryption":"WPA PSK (TKIP)","channel":1,"bssid":"F8:1A:67:7C:D3:9C","mode":"Master","quality":44},{"signal":-82,"quality_max":70,"ssid":"VT-SECN-AP","encryption":"WPA PSK (TKIP)","channel":1,"bssid":"F8:1A:67:90:FB:70","mode":"Master","quality":28},{"signal":-52,"quality_max":70,"ssid":"HomeNet","encryption":"WPA2 PSK (CCMP)","channel":6,"bssid":"D4:A0:2A:31:12:AA","mode":"Master","quality":58},{"signal":-89,"quality_max":70,"ssid":"ComedyCentral","encryption":"WPA2 PSK (CCMP)","channel":1,"bssid":"44:D8:84:69:B6:8D","mode":"Master","quality":21},{"signal":-88,"quality_max":70,"ssid":"NETGEAR99","encryption":"WPA2 PSK (CCMP)","channel":6,"bssid":"00:8E:F2:8F:95:EA","mode":"Master","quality":22}]},
{"time":"Sun Sep 22 15:04:41 2013","wScan":[{"signal":-82,"quality_max":70,"ssid":"vt-mesh","encryption":"None","channel":1,"bssid":"02:CA:FF:EE:BA:BE","mode":"Ad-Hoc","quality":28},{"signal":-11,"quality_max":70,"ssid":"VT-SECN-AP","encryption":"WPA PSK (TKIP)","channel":1,"bssid":"F8:1A:67:DE:2B:5E","mode":"Master","quality":70},{"signal":-72,"quality_max":70,"ssid":"VT-SECN-AP","encryption":"WPA PSK (TKIP)","channel":1,"bssid":"F8:1A:67:7C:D3:9C","mode":"Master","quality":38},{"signal":-83,"quality_max":70,"ssid":"VT-SECN-AP","encryption":"WPA PSK (TKIP)","channel":1,"bssid":"F8:1A:67:90:FB:70","mode":"Master","quality":27},{"signal":-55,"quality_max":70,"ssid":"HomeNet","encryption":"WPA2 PSK (CCMP)","channel":6,"bssid":"D4:A0:2A:31:12:AA","mode":"Master","quality":55},{"signal":-89,"quality_max":70,"ssid":"ComedyCentral","encryption":"WPA2 PSK (CCMP)","channel":1,"bssid":"44:D8:84:69:B6:8D","mode":"Master","quality":21},{"signal":-86,"quality_max":70,"ssid":"NETGEAR99","encryption":"WPA2 PSK (CCMP)","channel":6,"bssid":"00:8E:F2:8F:95:EA","mode":"Master","quality":24}]},
{"time":"Sun Sep 22 15:04:48 2013","wScan":[{"signal":-54,"quality_max":70,"ssid":"vt-mesh","encryption":"None","channel":1,"bssid":"02:CA:FF:EE:BA:BE","mode":"Ad-Hoc","quality":56},{"signal":-72,"quality_max":70,"ssid":"VT-SECN-AP","encryption":"WPA PSK (TKIP)","channel":1,"bssid":"F8:1A:67:DE:2B:5E","mode":"Master","quality":38},{"signal":-14,"quality_max":70,"ssid":"VT-SECN-AP","encryption":"WPA PSK (TKIP)","channel":1,"bssid":"F8:1A:67:7C:D3:9C","mode":"Master","quality":70},{"signal":-84,"quality_max":70,"ssid":"VT-SECN-AP","encryption":"WPA PSK (TKIP)","channel":1,"bssid":"F8:1A:67:90:FB:70","mode":"Master","quality":26},{"signal":-58,"quality_max":70,"ssid":"HomeNet","encryption":"WPA2 PSK (CCMP)","channel":6,"bssid":"D4:A0:2A:31:12:AA","mode":"Master","quality":52},{"signal":-88,"quality_max":70,"ssid":"ComedyCentral","encryption":"WPA2 PSK (CCMP)","channel":1,"bssid":"44:D8:84:69:B6:8D","mode":"Master","quality":22},{"signal":-86,"quality_max":70,"ssid":"NETGEAR99","encryption":"WPA2 PSK (CCMP)","channel":6,"bssid":"00:8E:F2:8F:95:EA","mode":"Master","quality":24}]}
]}
```

## Please Give Feedback

Feedback can be provided though the Village Telco Forums.
