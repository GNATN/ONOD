function getItem (fromObj, key) {
	var current = fromObj;
    for(var i = 0; i < key.length; i++) {
        if(current[key[i]]) {
            current = current[key[i]];
        } else {
            return null;
        }
    }
    return current;
}

function channelData (newData, index, lineG) {
	lineG = lineG === undefined ? false : lineG;
	var cData = {count: {}, aData: {}}, cMax = 12;
	$.each(newData[index].data, function () {
		var key = this.channel;
		if (cData.count[key]) {
			cData.count[key]++;
			cData.aData[key][this.bssid] = {ssid: this.ssid, signal: this.signal};
		} else {
			cData.count[key] = 1;
			cData.aData[key] = {};
			cData.aData[key][this.bssid] = {ssid: this.ssid, signal: this.signal};
			if (key > cMax) cMax = key;
		}
	});

	cData.total = 0;
	for (var i = 1; i <= cMax; i++) {
		if (!cData.count[i]) cData.count[i] = 0;
		else cData.total += cData.count[i];
	}

	if (lineG) {
		return cData;
	} else {
		return cData.count;
	}
}


/**
 * ONOD Lua Interface Class
 * Constructor Parameters:
 *		-> sleepTime = Interval in seconds between data re-poll (server-side) (Default: 5 seconds)
 *		-> runTime = Length of time to run logger job for (Default: 0 - infinite run)
 *		-> maxLn = Maximum lines of data entries to keep in JSON file. Should match with defined graph columns.
 **/
function Lua (sleepTime, runTime, maxLn, dataTypes, resetLog) {
	this.sleepTime = sleepTime === undefined ? 5 : sleepTime;
	this.runTime = runTime === undefined ? 0 : runTime;
	this.maxLn = maxLn === undefined ? 25 : maxLn;
	this.dataTypes = dataTypes === undefined ? ["assoc","batman","scan"] : dataTypes;
	this.resetLog = resetLog == undefined ? resetLog : 0;
}

Lua.prototype.start = function (reset) {
	if(this.resetLog) {
		reset = this.resetLog;
		this.resetLog = 0;
	} else 
		reset = reset === undefined ? 0 : reset;

	xhr = new XMLHttpRequest();
	xhr.open("GET", "/lua/?action=start&sleep_time=" + this.sleepTime + "&run_time=" + this.runTime + "&max_lines=" + this.maxLn + "&reset_file=" + reset + "&types=" + this.processDataTypes(this.dataTypes));
	xhr.send();
};

Lua.prototype.stop = function () {
	var xhr = new XMLHttpRequest();
	xhr.open("GET", "/lua/?action=stop");
	xhr.send();
};

Lua.prototype.restart = function (reset) {
	if(this.resetLog) {
		reset = this.resetLog;
		this.resetLog = 0;
	} else 
		reset = reset === undefined ? 0 : reset;
	xhr = new XMLHttpRequest();
	xhr.open("GET", "/lua/?action=restart&sleep_time=" + this.sleepTime + "&run_time=" + this.runTime + "&max_lines=" + this.maxLn + "&reset_file=" + reset + "&types=" + this.processDataTypes(this.dataTypes));
	xhr.send();
};

Lua.prototype.processDataTypes = function(dataArr) {
	var str;
	str = dataArr[0];
	for (var i = 1; i < dataArr.length; i++) {
		str = str + "," + dataArr[i];
	};
	console.log(str);
	return str;
};

Lua.prototype.updateLogSet = function(sleepTime, runTime, maxLn, dataTypes, resetLog) {
	if(!(sleepTime === undefined))
		this.sleepTime = sleepTime;
	if(!(runTime === undefined))
		this.runTime = runTime;
	if(!(maxLn === undefined))
		this.maxLn = maxLn;
	if(!(dataTypes === undefined) && dataTypes != null)
		this.dataTypes = dataTypes;
	if(!(resetLog === undefined))
		this.resetLog = resetLog;
};


/**
 * ONOD Dispatcher Class
 * Constructor Parameters:
 *		-> refList = reference list of all log files, and their binding's each button on the side nav bar
 *		-> retrivClass = Pointer to a class that fetches data from the server 
 *		-> mSecs = Interval in seconds between data re-poll (Client-side) (Default: 5 seconds)
 **/
function Dispatcher (refList, retrivClass, mSecs) {
	this.refList = refList;
	this.rClass = retrivClass === undefined ? new JSON() : retrivClass;
	this.mSecs = mSecs === undefined ? 5000 : mSecs;
	this.aRef = this.refList[0];
	this.blockFlg = false;
	try
	{	
		if(this.blockFlg) throw "Dispatcher Blocked";
		this.blockFlg = true;
		if(this.aRef) {
			this.getData(true);
			this.interv = this.intervalUpdate(this.mSecs);
		} else throw "Err: ref is null";
		return 1;
	}
	catch(err)
	{
		console.log(err);
		return null;
	}
}

/**
 * ONOD Dispatcher Class Start Interval Callback  Function
 * Parameters:
 *		-> retrivClass = Pointer to a class that fetches data from the server
 *		-> ref = ref includes an ID and a URL of where to find the log File. 
 *		-> mSecs = Interval in seconds between data re-poll (Client-side) (Default: 5 seconds)
 **/
Dispatcher.prototype.intervalUpdate = function (mSecs) {
	this.stopInterv();
	var self = this;
	return setInterval(function() {
		try
		{	
			if(self.blockFlg) throw "Dispatcher Blocked";
			self.blockFlg = true;
			self.getData()}
		catch(err)
		{
			console.log(err);
			return null;
		}}, mSecs);
};

/**
 * ONOD Dispatcher Class Update Timeout Function
 * Parameters: 
 *		-> mSecs = Interval in seconds between data re-poll (Client-side) (Default: 5 seconds)
 **/
Dispatcher.prototype.updateTimeout = function(mSecs) {
	this.mSecs = mSecs === undefined ? 5000 : mSecs;
	if(this.aRef) 
		this.interv = this.intervalUpdate(this.mSecs);
	else console.log("Ref is null, can not Start.");
};

Dispatcher.prototype.disBlock = function() {
	this.blockFlg = true;
};

Dispatcher.prototype.disUnblock = function() {
	this.blockFlg = false
};

/**
 * ONOD Dispatcher Class Set Active File Function
 * Parameters: 
 *		-> id = Changes the active log file that will be pulled from the server by the id
 **/
Dispatcher.prototype.setActive = function(id) {
	var tempRef = this.refList[id];
	try
	{	
		if(this.blockFlg) throw "Dispatcher Blocked";
		this.blockFlg = true;
		if(tempRef) {
			if(this.aRef) 
				this.aRef.oGrp.removeGroup();
			this.aRef = this.refList[id];
			this.getData(true);
			this.interv = this.intervalUpdate(this.mSecs);
		} else throw "Err: ref is null";
		return 1;
	}
	catch(err)
	{
		console.log(err);
		return null;
	}
};

Dispatcher.prototype.getData = function(fUpd) {
	this.rClass.startFetch(this, this.aRef, fUpd);
};

Dispatcher.prototype.startInterv = function() {
	clearInterval(this.interv);
	if(this.aRef) 
		this.interv = this.intervalUpdate(this.mSecs);
	else console.log("Ref is null, can not Start.");
};


/**
 * ONOD Dispatcher Class Stop Interval callback Function
 * Parameters: 
 *		-> id = Changes the active log file that will be pulled from the server by the id
 **/
Dispatcher.prototype.stopInterv = function() {
	clearInterval(this.interv);
};

/**
 * ONOD Dispatcher Class Update Reference List Function
 * Parameters: 
 *		-> refList = Updates the reference list that the Dispatcher uses to find the url to download the log
 **/
Dispatcher.prototype.updatateRefList = function(refList) {
	this.refList = refList;
};

Dispatcher.prototype.addRef = function(ref) {
	this.refList.push(ref);
};

Dispatcher.prototype.forceUpdate = function () {
	clearInterval(this.interv);
	try
	{	
		if(this.blockFlg) throw "Dispatcher Blocked";
		this.blockFlg = true;
		if(this.aRef) 
			this.aRef.oGrp.removeGroup();
		this.getData(true);
		this.interv = this.intervalUpdate(this.mSecs);
	}
	catch(err)
	{
		console.log(err);
	}
};


/**
 * ONOD JSON Interface Class
 **/
function JSON (storage) {
	this.logStorage = storage;
}

/**
 * ONOD JSON Class Start Interval Callback Function
 * Parameters:
 *		-> ref = ref includes an ID and a URL of where to find the log File. 
 *		-> fUpd = Flag that when set to true will force a redraw and poll of that tabs information (if not set, defaults to false) 
 */
JSON.prototype.getLogRequests = function(aRef, fUpd) {
	var self = this, dObj = [];
	if(Object.prototype.toString.call(aRef.url) === '[object Array]') {
		$.each(aRef.url, function (key, element) {
			dObj.push(self.fetchNewData(element, fUpd));
		});
		return dObj;
	} else {
		dObj.push(self.fetchNewData(aRef.url, fUpd));
		return dObj;
	}
};

JSON.prototype.startFetch = function(oDisp, aRef, fUpd) {
	
	var self = this; self.aRef = aRef; self.oDisp = oDisp;
	//var processData = $.when(self.rClass.fetchNewData(self, self.aRef, fUpd));
	var fetchData = $.when.apply($, this.getLogRequests(aRef, fUpd));

	fetchData.done(function () {
		function processFetch (url, data, jqXHR, fUpd) {
			if(jqXHR.statusText == "OK") {
				self.updateLog(url, data);
				self.processData(self.oDisp, self.aRef, data);
			} else if(jqXHR.statusText == "Not Modified" && fUpd) {
				self.processData(self.oDisp, self.aRef, self.getLog(url));
			} else self.oDisp.disUnblock();
		}

		if(Object.prototype.toString.call(arguments[0]) === '[object Array]') {
			$.each(arguments, function (key, element) {
				processFetch(this[0], this[1], this[2], this[3]);
			});
		} else processFetch(arguments[0], arguments[1], arguments[2], arguments[3]);
	});

	fetchData.fail(function () {
		self.oDisp.disUnblock();
	});
};

JSON.prototype.fetchNewData = function (url, fUpd) {
	var self = this, getJSON = $.Deferred();
	if (fUpd === undefined) fUpd = false;
	
	$.ajax({
		url: url,
		type: 'GET',
		dataType: 'json',
		ifModified:true,
		success: function (data, status, jqXHR) {
			getJSON.resolve(url, data, jqXHR, fUpd);
		}, 
		error: function(jqXHR, ajaxOptions, thrownError) {
			if(jqXHR.status != 404)
				console.log(jqXHR.status + ": " + jqXHR.statusText + ", " + jqXHR.responseText);
			getJSON.reject();
		},
		beforeSend: setHeader
	});

	function setHeader(xhr) {
		xhr.setRequestHeader("If-Modified-Since");
    }

    return getJSON;
}

JSON.prototype.processData = function(oDisp, aRef, data) {
	function dProcess (oGrp, tID, data) {
		oGrp.updateGroup(self.processJSON(tID, data));
		d.resolve();
	}

	var self = this, d = $.Deferred();

	d.done(function () {
		self.oDisp.disUnblock();
	})

	if(aRef.oGrp !== null) {
		dProcess(aRef.oGrp, aRef.oGrp.tID, data);
	} else d.resolve();
};

JSON.prototype.getLog = function(url) {
	var id = this.hashCode(url);
	if(this.logStorage[id] == undefined) {
		return null;
	} else return this.logStorage[id].data;
};

JSON.prototype.hashCode = function(url) {
	/*
	function hashFunction () {
        char  = url.charCodeAt(i);
	    hash  = ((hash<<5)-hash)+char;
	    hash |= 0; // Convert to 32bit integer
	
	    if (++i < l) {
	    	setTimeout(hashFunction, 0);
	    }
    }
    
	if (url.length == 0) 
		return hash;
	else {
		var hash = 0, i, l = url.length, char;
		setTimeout(hashFunction, 0)
	}
	return hash;
	*/
	var hash = 0, i, char;
    if (url.length == 0) return hash;
    for (i = 0, l = url.length; i < l; i++) {
        char  = url.charCodeAt(i);
        hash  = ((hash<<5)-hash)+char;
        hash |= 0; // Convert to 32bit integer
    }
    return hash;
};

JSON.prototype.addLog = function(url, data) {
	var hashCode, flag;
	hashCode = this.hashCode(url);
	flag = this.logStorage[hashCode] === undefined ? true : false;

	if (flag) {
		this.logStorage[hashCode] = {hashCode: hashCode, data: data};
	} else {
		console.log("HashCode Clash!!!");
	}
};

JSON.prototype.updateLog = function (url, data) {

	var obj = this.getLog(url);
	if (obj == null) this.addLog(url, data);
	else obj.data = data;
};

JSON.prototype.processJSON = function (jID, jData) {
	function bScoreConvert (log) {
		var dataSeries = {};
		
		$.each(log.items, function (key) {
			var date = this.time.split(/(?:\s+)/g);
			var time = {day: date[0], month: date[1], date: date[2], time: date[3], year: date[4]};
			
			$.each(this.originNodes, function () { 
				var key = this[0], flag = dataSeries[key] === undefined ? true : false;

				if (flag) {
					dataSeries[key] = {mac: key, time: [time], data: [this[2]], ls: [this[1]]};
				} else {
					dataSeries[key].time.push(time);
					dataSeries[key].data.push(this[2]);
					dataSeries[key].ls.push(this[1]);					
				}
			});
		});
		
		return dataSeries;
	}

	function aListConvert (log) {
		var dataSeries = {};
		
		$.each(log.items, function (key) {
			var date = this.time.split(/(?:\s+)/g);
			var time = {day: date[0], month: date[1], date: date[2], time: date[3], year: date[4]};
			
			$.each(this.data, function (key) {
				var flag = dataSeries[key] === undefined ? true : false;

				if (flag) {
					dataSeries[key] = {mac: key, time: [time], data: {signal: [this.signal], noise: [this.noise]}, snr: [this.signal - this.noise]};
				} else {
					dataSeries[key].time.push(time);
					dataSeries[key].data.signal.push(this.signal);
					dataSeries[key].data.noise.push(this.noise);
					dataSeries[key].snr.push(this.signal - this.noise);
				}
			});
		});
		
		return dataSeries;
	}

	function wScanConvert (log) {
		var dataSeries = [];

		$.each(log.items, function(key) {
			var date = this.time.split(/(?:\s+)/g);
			var time = {day: date[0], month: date[1], date: date[2], time: date[3], year: date[4]};
			
			dataSeries.push({time: time, data: this.wScan});
		});

		return dataSeries;
	}

	function RSSIConvert (log) {
		var dataSeries = {};
		$.each(log.items, function(key) {
			var date = this.time.split(/(?:\s+)/g);
			var time = {day: date[0], month: date[1], date: date[2], time: date[3], year: date[4]};
						
			$.each(this.data, function (key) {
				var flag = dataSeries[key] === undefined ? true : false;

				if (flag) {
					dataSeries[key] = {mac: key, time: [time], data: [this.signal - this.noise]};
				} else {
					dataSeries[key].time.push(time);
					dataSeries[key].data.push(this.signal - this.noise);
				}
			});
		});
		return dataSeries;
	}

	var newData;
	switch (jID) {
		case 0:
			break;
		case 1:
			newData = bScoreConvert(jData);
			break;

		case 2:
			newData = aListConvert(jData);
			break;

		case 3:
			newData = wScanConvert(jData);
			break;

		case 4:
			newData = RSSIConvert(jData);
			break;

		default:
			newData = null;
			break;
	}
	return newData;
};


/**
 * ONOD Object Group Class
 **/
function oGroup (cObj, flag, tID) {
	this.cObj = cObj;
	this.cFlg = flag;
	this.tID = tID
	this.gSpa = this.cObj.pHt * 0.5;
}

oGroup.prototype.updateGroup = function (newData) {
	function processGraph () {
		switch (self.tID) {
			case 0: 
			break;
			case 1:
				if (self.cObj.gObj[i]) {
					self.cObj.gObj[i].update(self.cObj, newData[self.cObj.gObj[i].gMAC]);				
				} else {
					var gColors = ['#3f72bf', '#50e7f7', '#11f4c8'],
						gHvrTagCfgStr = 'timestamp br L="Batman Quality Score" D=0 br P="ls" L="Node Last Seen" sp T="(s)"',
						gObj = new Graph (75, 50 + (self.gSpa * i), 13, newData[dKey[i]].data.length, 260, gColors[i]);

					gObj.setTitles("Node (" + dKey[i] + ")", "Time (HH-MM-SS)", "Score (0 - 255)");
					gObj.create(self.cObj, newData[dKey[i]], newData[dKey[i]].time, gHvrTagCfgStr);
					self.cObj.gObj.push(gObj);
				}
			break;
			
			case 2:
				if (self.cObj.gObj[i]) {
					self.cObj.gObj[i].update(self.cObj, newData[self.cObj.gObj[i].gMAC]);
				} else {
					var gColors = ['#3f72bf', '#50e7f7', '#11f4c8'],
						gHvrTagCfgStr = 'timestamp br L="Signal" D=0 sp L="Noise" D=1 br P="snr" L="SNR" sp T="(dB)"',
						gObj = new Graph (75, 50 + (self.gSpa * i), 10, newData[dKey[i]].data.signal.length, -100, [gColors[i], "#f00"]);
					
					gObj.setTitles("Node (" + dKey[i] + ")", "Time (HH-MM-SS)", "dB (-100 - 0)");
					gObj.create(self.cObj, newData[dKey[i]], newData[dKey[i]].time, gHvrTagCfgStr);
					self.cObj.gObj.push(gObj);
				}
			break;

			case 4: 
				if (self.cObj.gObj[i]) {
					self.cObj.gObj[i].update(self.cObj, newData[self.cObj.gObj[i].gMAC]);				
				} else {
					var gColors = ['#3f72bf', '#50e7f7', '#11f4c8'],
						gHvrTagCfgStr = 'timestamp br L="Recieved Signal Strength Indicator" D=0 br',
						gObj = new Graph (75, 50 + (self.gSpa * i), 13, newData[dKey[i]].data.length, 120, gColors[i]);

					gObj.setTitles("Node (" + dKey[i] + ")", "Time (HH-MM-SS)", "Score (0 - 255)");
					gObj.create(self.cObj, newData[dKey[i]], newData[dKey[i]].time, gHvrTagCfgStr);
					self.cObj.gObj.push(gObj);
				}
			break;
		}

		if (++i < dCount) {
			setTimeout(processGraph, 0);
		} else if (self.cFlg === 0) {
			self.cObj.setDim(self.gSpa * dCount);
		}
	}

	function processTable () {
		function processLineColors () {
			if (self.tObj.gColors === undefined) {
				self.tObj.gColors = {}, self.tObj.gColors.cArr = [];
				$.each(cDta.aData, function (channel) {
					$.each(this, function (bssid) {
						var newColor = '#'+('00000'+(Math.random()*(1<<24)|0).toString(16)).slice(-6);
						self.tObj.gColors[bssid] = newColor;
						self.tObj.gColors.cArr.push(newColor);
					});
				});
			} else if (self.tObj.gColors.cArr.length !== cDta.total) {
				$.each(cDta.aData, function (channel) {
					$.each(this, function (bssid) {
						if (self.tObj.gColors[bssid] === undefined) {
							var newColor = '#'+('00000'+(Math.random()*(1<<24)|0).toString(16)).slice(-6);
							self.tObj.gColors[bssid] = newColor;
							self.tObj.gColors.cArr.push(newColor);
						}
					});
				});
			}
		}

		function processChannelGraphs () {
			if (self.tObj.gLine) {
				processLineColors();
				self.tObj.gObj.altD = true;
				self.tObj.gObj.setColor(self.tObj.gColors.cArr);
				self.tObj.gObj.setTitles("WiFi AP Channel Information", "Channel", "Signal Strength (dBm)");				
			} else {
				var gColors = ["#2f69bf", "#a2bf2f", "#bf5a2f", "#bfa22f", "#772fbf", "#bf2f2f", "#00327f", "#667f00", "#7f2600", "#7f6500"];
				self.tObj.gObj.altD = false;
				self.tObj.gObj.setColor(gColors);
				self.tObj.gObj.setTitles("WiFi AP Channel Information", "Channel", "AP #");		
			}
		}		

		if (self.tObj) {
			self.tObj.update(newData);
		} else {
			var tCfg = { ssid: "SSID", bssid: "BSSID", mode: "Mode", 'encryption': "Encryption", quality: "Quality", signal: "Signal", channel: "Channel" }
				tObj = new Table (self.cObj.dDiv);
			tObj.create(tCfg, newData);
			self.tObj = tObj;
			
			var oldCvs = self.cObj.push(self.tObj.cDiv), 
				gCols = self.tObj.gLine ? 14 : 11, gObj, cDta, tCol;

			cDta = channelData(newData, newData.length - 1, self.tObj.gLine);
			gObj = new Graph (50, 50, 10, gCols, -100);
			self.tObj.gObj = gObj;

			processChannelGraphs();

			if (self.tObj.gLine) {
				gObj.create(self.cObj, cDta, null, null, self.cObj.pWd * 0.9, self.cObj.pHt * 0.6);
			} else {
				gObj.createBarGraph(self.cObj, cDta);
			}

			gObj.lastIndex = newData.length - 1;

			var gSwitch = gObj.switchGraphBtn(self.tObj.gLine);

			$(gSwitch).on('switch-change', function () {
				self.tObj.gLine = self.tObj.gLine ? false : true;
				cDta = channelData(newData, self.tObj.gObj.lastIndex, self.tObj.gLine);
				processChannelGraphs();
				self.tObj.gObj.barUpdate(cDta);
				self.tObj.updateRowColor();
			});
			
			self.cObj.cObj[oldCvs].rObj.canvas.style.display = "none";
		}
	}

	function processCustom () {

	}

	if (newData != null) { 
		var dKey = Object.prototype.toString.call(newData) === '[object Object]' ? Object.prototype.constructor.keys(newData) : null,
			dCount = dKey ? dKey.length : newData.length,
			self = this, i = 0;

		switch (this.cFlg) {
			case 0:
				this.cObj.show();
				this.gSpa = this.cObj.pHt * 0.5 < 312 ? 312 : this.cObj.pHt * 0.5;
				setTimeout(processGraph, 0);
			break;

			case 1:
				processTable();
			break;

			case 2: 

			break;

			case 3:
				processCustom();
			break;
		}		 
	}
};

oGroup.prototype.bindToGroup = function () {

};

oGroup.prototype.removeGroup = function () {
	switch (this.cFlg) {
		case 0:
			for (var i = 0; i < this.cObj.gObj.length; i++)
				this.cObj.gObj[i].remove();
			this.cObj.gObj.length = 0;
			if (this.cObj.gVis) this.cObj.gVis.length = 0;
			$("#" + this.cObj.dDiv)[0].scrollTop = 0;
		break;

		case 1:
			this.cObj.pop();
			this.tObj.remove();
			this.tObj = null;
		break;
	}
};


/**
 * ONOD Table Class
 **/
function Table (destDiv, tNav, tProps) {
	this.dDiv = destDiv;
	this.drawNav = tNav === undefined ? true : tNav;
	this.tProps = tProps === undefined ? {tHt: null, tWd: null, nHt: null, nWd: null} : tProps;
	this.tKeys = [];
}

Table.prototype.create = function (tConf, newData) {
	var tLoc = document.getElementById(this.dDiv),
		oTbl = document.createElement("div"),
		tHTML = document.createElement("table");
	
	$(oTbl).css({"height": this.tProps.tHt == null ? "50%" : this.tProps.tHt + "px",
				 "width": this.tProps.tWd == null ? "100%" : this.tProps.tWd + "px",
				 "overflow": "auto"});
	
	tHTML.className = "table table-condensed table-hover";
	
	var tHead = '<thead><tr>', that = this;
	tHead = tHead + '<th>#</th>';
	$.each(tConf, function (key) {
		tHead = tHead + '<th>' + this + '</th>';
		that.tKeys.push(key);
	});
	tHead = tHead + '</tr></thead>';

	var tBody = '<tbody></tbody>'
	tHTML.innerHTML = tHead + tBody;
	
	var cDiv = document.createElement("div");
	$(cDiv).css({"height": "50%", "width": "calc(100% - 250px)", "float": "right", 
				 "min-height": "225px", "min-width": "350px", "margin-left": "250px",
				 "overflow": "auto", "position": "absolute"});
	
	oTbl.appendChild(tHTML);
	tLoc.appendChild(oTbl);
	tLoc.appendChild(cDiv);

	this.oTbl = oTbl;
	this.cDiv = cDiv;
	
	if (this.drawNav) {
		var nDiv = document.createElement("div"),
			tNav = document.createElement("ul");

		$(nDiv).css({"height": this.tProps.nHt == null ? "50%" : this.tProps.nHt + "px",
				 	 "width": this.tProps.nWd == null ? "250px" : this.tProps.nWd + "px",
				 	 "min-height": "100px", "min-width": "250px", "overflow": "auto", "position": "absolute"});

		tNav.className = "nav nav-pills nav-stacked";

		$.each(newData, function (key) {
			$(tNav).prepend('<li value="' + key + '"><a href="#">' + this.time.day + ' ' + this.time.date + ' ' + this.time.month + ' ' + this.time.year + ' ' + this.time.time + '</a></li>');
		});

		tNav.firstChild.className = "active";
		nDiv.appendChild(tNav);

		$(tNav).children().click(newData, function () {
			$(this.parentElement.children).each(function() { 
				if ($(this).hasClass('active')) {
					$(this).removeClass('active');
					return;
				}
			});
			$(this).addClass('active');
			that.update(newData, this.value);
			that.gObj.barUpdate(newData, this.value);
			that.gLine && that.updateRowColor();
		});

		tLoc.appendChild(nDiv);
		this.tNav = nDiv;
	}

	this.update(newData, newData.length - 1);
};

Table.prototype.remove = function () {
	$(this.oTbl).remove();
	$(this.cDiv).remove();
	$(this.tNav).remove();
};

Table.prototype.update = function (newData, newIndex) {
	if (newIndex === undefined && this.tNav) {
		var nDest = $(this.tNav.firstChild), oldActive;
		
		if (nDest.children().length) {
			nDest.children().each(function () {
				if ($(this).hasClass('active')) {
					oldActive = this.textContent;
					return;
				}
			});
			nDest.children().remove();
		}

		$.each(newData, function (key) {
			nDest.prepend('<li value="' + key + '"><a href="#">' + this.time.day + ' ' + this.time.date + ' ' + this.time.month + ' ' + this.time.year + ' ' + this.time.time + '</a></li>');
			if (nDest.children().first()[0].textContent == oldActive) nDest.children().first().addClass('active');
		});

		var cData = {tObj: this, tDta: newData};
		nDest.children().click(cData, function () {
			$(this.parentElement.children).each(function() { 
				if ($(this).hasClass('active')) {
					$(this).removeClass('active');
					return;
				}
			});
			$(this).addClass('active');
			tObj.update(cData.tDta, this.value);
			tObj.gObj.barUpdate(cData.tDta, this.value);
			tObj.gLine && tObj.updateRowColor();
		});
	} else {
		var tDest = $(this.oTbl.firstChild.lastChild),
			tableHTML = '', that = this;

		if (tDest.children().length)
			tDest.children().remove();

		$.each(newData[newIndex].data, function (row, rowItem) {
			tableHTML = tableHTML + '<tr>';
			tableHTML = tableHTML + '<td>' + (row + 1) + '</td>';
			$.each(that.tKeys, function (key) {
				var iNest = this.split(/\./g);
				tableHTML = tableHTML + '<td>' + getItem(rowItem, iNest) + '</td>';
			});
			tableHTML = tableHTML + '</tr>';
		});

		tDest.append(tableHTML);
	}
};

Table.prototype.updateRowColor = function () {
	var tRows = $(this.oTbl.firstChild.lastChild).children(), that = this;
	$.each(tRows, function () {
		var ssidObj = this.children[1], bssidObj = this.children[2],
			bssid = bssidObj.innerText,	
			rowColor = that.gLine ? that.gColors[bssid] : '#000';

		ssidObj.style.fontWeight = that.gLine ? "900" : "normal";
		bssidObj.style.fontWeight = that.gLine ? "900" : "normal";
		ssidObj.style.color = rowColor;
		bssidObj.style.color = rowColor;
	});
};


/**
 * ONOD Raphael Graph Class
 * Constructor Parameters:
 * 		-> xPos  = x-Axis Graph destination co-ordinate
 * 		-> yPos  = y-Axis Graph destination co-ordinate
 * 		-> gRows = Row count of Graph and Grid
 *		-> gCols = Column count of Graph and Grid
 *		-> yMaxVal = Used for scaling of y-Axis labels, (yMaxVal / gRows) should be a round number
 *		-> gColor = Single or Array of Hex color values to be used for plotted graph data series (Default: Random)
 *		-> gBdr = Graph border margin in pixels (Default: 20px)
 *
 * Public Member Variables:
 *		-> gTtl = Container Object for Graph Titles (main, x, y)
 *		-> gTtlObjs = Container for Graph Title objects if defined
 * 		-> gUpd = Flag to determine whether complete draw (grid, title, hide button) or data update
 *		-> gVis = Flag to determine whether graph object is visible within canvas div
 * 		-> gWd  = Graph Width (Default: 90% of canvas container width - can be passed as parameter on create)
 *		-> gHt  = Graph Height (Default: 25% of canvas container height - can be passed as parameter on create)
 *		-> gHideBtn = HTML Element containing created Graph Hide Button
 *		-> gObj = Handle to Raphael line graph object
 **/
function Graph (xPos, yPos, gRows, gCols, yMaxVal, gColor, gBdr) {
	this.xPos = xPos;
	this.yPos = yPos;
	this.gRow = gRows;
	this.gCol = gCols;
	this.gMax = yMaxVal;
	gColor = gColor === undefined ? '#'+(Math.random() * 0xFFFFFF << 0).toString(16) : gColor;
	this.gColor = Object.prototype.toString.call(gColor) === '[object Array]' ? gColor : [gColor];
	this.gColor.push('transparent');
	this.gBdr = gBdr === undefined ? 20 : gBdr;
	this.gTtl = {tSet: false};
	this.gUpd = false;
	this.gVis = true;
}

/**
 * ONOD Graph Class LineGraph Create Function
 * Parameters:
 * 		-> rData = Canvas object, required to create and store graphs into
 *		-> yData = Data array containing data series elements to be plotted
 *		-> xLabel = Array of custom x-axis labels to replace default
 *		-> hTagStr = Configuration string defining information displayed within graph hover tag 
 *		-> gWidth = Allow over-ride of automatic graph scaling and static graph width to be set
 * 		-> gHeight = Allow over-ride of automatic graph scaling and static graph height to be set
 * Return:
 *		-> Handle to Graph object and properties stored into Canvas (rData.gObj)
 **/
Graph.prototype.create = function (rData, yData, xLabel, hTagStr, gWidth, gHeight) {
	// Internal function to create graph background grid
	Raphael.fn.drawGrid = function (x, y, w, h, wv, hv) {
	    var path = ["M", Math.round(x) + .5, Math.round(y) + .5, "L", Math.round(x + w) + .5, Math.round(y) + .5, Math.round(x + w) + .5, Math.round(y + h) + .5, Math.round(x) + .5, Math.round(y + h) + .5, Math.round(x) + .5, Math.round(y) + .5],
	        rowHeight = h / hv,
	        columnWidth = w / wv;
	    for (var i = 1; i < hv; i++) {
	        path = path.concat(["M", Math.round(x) + .5, Math.round(y + i * rowHeight) + .5, "H", Math.round(x + w) + .5]);
	    }
	    for (i = 1; i < wv; i++) {
	        path = path.concat(["M", Math.round(x + i * columnWidth) + .5, Math.round(y) + .5, "V", Math.round(y + h) + .5]);
	    }
		
	    return this.path(path.join(",")).attr({stroke: "#000", fill: "#333"});
	};

	// Internal function to create red cross graph hide button
	function createHideButton (gObj) {
		var btnDiv = document.createElement("div"),
			btnItm = document.createElement("button"),
			btnLoc = document.getElementById(rData.dDiv);
		btnDiv.className = "btn-group";
		btnItm.className = "btn btn-danger";
		btnItm.innerHTML = '<span class="glyphicon glyphicon-chevron-down" style="color:#000000;"></span>';
		btnDiv.appendChild(btnItm);
		btnDiv.setAttribute("style", "position: absolute; top:" + ( gObj.yPos - 35 ) + "px; left:" + (gObj.gWd + gObj.xPos - 10) + "px;");
		btnLoc.appendChild(btnDiv);
		return btnDiv;
	}

	// Internal function to create and apply hover tag definition to graph
	function setHoverTag (gObj, tagFormatStr, altTag) {
		altTag = altTag === undefined ? false : altTag;

		var mouseOn = function (x, y) { 
			if (this.axis > 0 && this.values[0]) {
				var tagString = tagFormatStr, newTagString = "", tIndex = this.axis - 1;

				this.symbols[0].attr({fill: this.symbols[0].attr('stroke')});
				gObj.tags = rData.rObj.set();

				while (tagString.length > 0) {
					var tStr = tagString.match(/\w+/);
					switch (tStr[0]) {
						case "timestamp":
							if (xLabel !== undefined && Object.prototype.toString.call(xLabel) === '[object Array]' && xLabel[tIndex] != null)
								newTagString = newTagString.concat("" + xLabel[tIndex].day + " " + xLabel[tIndex].date + " " + xLabel[tIndex].month + " " + xLabel[tIndex].year + " - " + xLabel[tIndex].time);
							tagString = tagString.replace(tStr[0], "").trim();
						break;

						case "br":
							newTagString = newTagString.concat("\n");
							tagString = tagString.replace(tStr[0], "").trim();
						break;

						case "sp":
							newTagString = newTagString.concat(" ");
							tagString = tagString.replace(tStr[0], "").trim();
						break;

						case "T":
							var tRes = tagString.match(/T."(?:.*?)"/);
							if (tRes) {
								var tTxt = tRes[0].match(/"([^"]*)"/).slice(1);
								newTagString = newTagString.concat(tTxt);
								tagString = tagString.replace(tRes[0], "").trim();
							}
						break;

						case "L":
							try {
								var tRes = tagString.match(/L."(?:.*?)"\sD.\d/);
								if (tRes.length) {
									var tLbl = tRes[0].match(/"([^"]*)"/).slice(1),
										tDts = Number(tRes[0].match(/\sD.\d/)[0].match(/\d/)[0]);
									newTagString = newTagString.concat(tLbl + " = " + this.values[tDts]);
									tagString = tagString.replace(tRes[0], "").trim();
								}
							} catch (e) {
								console.log('Hover Tag Error, most likely incorrect (L="label" D=n) format.');
							}
						break;

						case "P":
							try {
								var tRes = tagString.match(/P."(?:.*?)"\sL."(?:.*?)"/);
								if (tRes.length) {
									var tCpy = tRes[0],
									tPrp = tRes[0].match(/"([^"]*)"/).slice(1)[0];
									tCpy = tCpy.replace('"'+tPrp+'"', "");
									
									var	tLbl = tCpy.match(/"([^"]*)"/).slice(1)[0],
										tDta = getItem(yData, tPrp.split(/\./g));

									if (Object.prototype.toString.call(tDta) === '[object Array]')
										tDta = tDta[this.axis - 1];
									newTagString = newTagString.concat(tLbl + " = " + tDta);
									tagString = tagString.replace(tRes[0], "").trim();
								}
							} catch (e) {
								console.log('Hover Tag Error, most likely incorrect (P="prop" L="label") format.');
							}
						break;
					}
				}

				if (!altTag) {
					var tagRot = this.axis > gObj.gCol / 2 ? 180 : 0;
					var tag = rData.rObj.tag(this.x, this.y[0], newTagString, tagRot, 6).insertBefore(this).attr([{ fill: '#000', stroke: '#eee', 'stroke-width': 2, 'fill-opacity': .75 }, { fill: '#eee', 'fill-opacity': .8 }]);
					gObj.tags.push(tag);
				} else {
					var tagRot = this.axis > gObj.gCol / 2 ? "left" : "right";
					var tag = rData.rObj.popup(this.x, this.y[0], newTagString, tagRot, 10).attr([{fill: "#000", stroke: "#eee", "stroke-width": 2, "fill-opacity": .5}, {fill: '#eee', 'fill-opacity': .8}]);
					gObj.tags.push(tag);
				}
			}
		}

		var mouseOff = function () {
			if (this.axis > 0 && this.values[0]) {
				this.symbols[0].attr({fill: '#333'});
				gObj.tags && gObj.tags.remove();
			}		
		}

		lineGraph.hoverColumn(mouseOn, mouseOff);
	}

	if (!this.gUpd) {
		this.gMAC = yData.mac;
		this.gWd  = gWidth === undefined ? (rData.pWd * 0.85 < 24*this.gCol ? 24*this.gCol : rData.pWd * 0.85) : gWidth;
		this.gHt  = gHeight === undefined ? (rData.pHt * 0.25 < 12*this.gRow ? 12*this.gRow : rData.pHt * 0.25) : gHeight;
		
		this.createGraphTitles(rData);
		this.gGrid = rData.rObj.drawGrid(this.xPos + (this.gBdr / 2), this.yPos + (this.gBdr / 2), this.gWd - this.gBdr, this.gHt - this.gBdr, this.gCol, this.gRow);
		if (this.altD === undefined) this.gHideBtn = createHideButton(this);
	}

	var xAxisTemp = [], xAxis = [], yAxis = []; 
	for (var i = 0; i < this.gCol; i++) xAxisTemp[i] = i + 1;

	var gShd;
	if (this.altD) {
		var that = this;
		xAxisTemp.push(this.gCol + 1);

		$.each(yData.aData, function (channel) {
			channel = Number(channel);
			$.each(this, function (bssid) {
				yAxis.push([that.gMax, this.signal, that.gMax]);
				xAxis.push([channel - 1, channel + 1, channel + 3]);				
			});
		});

		gShd = true;
	} else {
		if (Object.prototype.toString.call(yData.data) === '[object Object]') {
			for (var i in yData.data) { 
				yAxis.push(yData.data[i]); 
				xAxis.push(xAxisTemp); 
			}
		} else {
			yAxis.push(yData.data);
			xAxis.push(xAxisTemp); 
		}

		if (yAxis.length > 1) {
			gShd = false;
			if (this.gColor.length < yAxis.length + 1) {
				this.gColor.length = 0;
				for (var i = 0; i < yAxis.length; i++) this.gColor.push('#'+(Math.random() * 0xFFFFFF << 0).toString(16));
				this.gColor.push('transparent');
			}
		} else {
			gShd = true;
		}		
	}
	xAxis.push([0, this.gCol]); yAxis.push([0, this.gMax]);	

	var lineGraph = rData.rObj.linechart(this.xPos, this.yPos, this.gWd, this.gHt, xAxis, yAxis, 
	{ 
		shade: gShd, 
		smooth: this.altD ? true : false,
		colors: this.gColor, 
		symbol: 'circle', 
		axis: '0 0 1 1', 
		width: 4, 
		axisxstep: this.gCol, 
		axisystep: this.gRow 
	});

	for (var i = 0; i < yAxis.length - 1; i++) 
		if (this.altD) {
			lineGraph.symbols[i].attr({fill: 'none', stroke: 'none'});
		} else {
			lineGraph.symbols[i].attr({r: 4, stroke: this.gColor[i], fill: '#333', "stroke-width": 2});
		}

	if (hTagStr !== undefined && Object.prototype.toString.call(hTagStr) === '[object String]') {
		setHoverTag(this, hTagStr);
		this.hTagStr = hTagStr;
	} else if (this.hTagStr !== undefined) {
		setHoverTag(this, this.hTagStr);
	}

	if (xLabel !== undefined && Object.prototype.toString.call(xLabel) === '[object Array]') {
		var xAxisLabels = lineGraph.axis[0].text.items;
		for (var i = 1; i < xAxisLabels.length; i++) { if (i - 1 < xLabel.length) { xAxisLabels[i].attr({'text': xLabel[i - 1].time, transform: "T -15 10"}); xAxisLabels[i].rotate(-40); } else { xAxisLabels[i].attr({'text': ""}); } }
		xAxisLabels[0].attr({'text': ""});
	} else if (this.altD) {
		var xAxisLabels = lineGraph.axis[0].text.items;
		for (var i = 2; i < xAxisLabels.length - 2; i++) {
			xAxisLabels[i].attr({'text': i - 1}); 
		}
		xAxisLabels[0].attr({'text' : ""});
		xAxisLabels[1].attr({'text' : ""});
		xAxisLabels[xAxisLabels.length - 2].attr({'text' : ""});
		xAxisLabels[xAxisLabels.length - 1].attr({'text' : ""});
	}

	this.gObj = lineGraph;
	this.gCvs = rData;
};

/**
 * ONOD Graph Class Bar Graph Create Function
 **/
Graph.prototype.createBarGraph = function (rData, yData, gWidth, gHeight) {
	var mouseOn = function () {
		that.tags = rData.rObj.set();
		var tag = rData.rObj.popup(this.bar.x, this.bar.y, "["+this.bar.value+"] x WiFi AP").insertBefore(this);
		that.tags.push(tag);
	}

	var mouseOff = function () {
		that.tags && that.tags.animate({opacity: 0}, 200, function () {this.remove();});
	}

	var xLabel = [], yAxis = [], that = this;
	$.each(yData, function (key) {
		yAxis.push(this.valueOf());
		xLabel.push(key);
	});

	if (yAxis.length > this.gColor.length) {
		var curLength = this.gColor.length;
		for (var i = this.gColor.length; i < yAxis.length; i++)
			this.gColor.push(this.gColor[i % curLength]);
	}

	if (!this.gUpd) {
		this.gWd  = gWidth === undefined ? rData.pWd * 0.9 : gWidth;
		this.gHt  = gHeight === undefined ? rData.pHt * 0.6 : gHeight;
		this.createGraphTitles(rData, 0.5);
	}

	var barGraph = rData.rObj.barchart(this.xPos, this.yPos, this.gWd, this.gHt, yAxis, {
		gutter: this.gBdr,
		colors: this.gColor
	});

	barGraph.hover(mouseOn, mouseOff);
	
	var gWd = this.gWd - (this.gBdr / 2), sAxis = gWd / yAxis.length;
	this.bTxt = Raphael.g.axis(this.xPos + sAxis/2, this.yPos + this.gHt - this.gBdr, gWd - sAxis, null, null, yAxis.length-1, 0, xLabel, rData.rObj);
	var line = this.bTxt.attr('path');
	line[0][1] = this.xPos + this.gBdr/2;	line[1][1] = this.gWd + 2*this.gBdr;
	this.bTxt.attr({path: line});
	
	this.gObj = barGraph;
	this.gCvs = rData;
};

Graph.prototype.switchGraphBtn = function (aState) {
	var bLoc = this.gCvs.dDiv,
		bDiv = document.createElement("div"),
		bObj = document.createElement("input");
		bSts = aState === undefined ? false : aState;

	bDiv.className = "switch switch";
	bDiv.dataset.onLabel = "Line";	  bDiv.dataset.offLabel = "Bar";
	bDiv.dataset.on = "warning";	  bDiv.dataset.off = "success";
	bDiv.style.position = "absolute"; bDiv.style.marginLeft = "-" + this.gWd + "px";

	bObj.type = "checkbox";			  bObj.id = "gChk1";
	bDiv.appendChild(bObj);

	bLoc.appendChild(bDiv);
	$(bDiv)['bootstrapSwitch']();

	if (bSts) {
		$(bDiv).children()[0].className = "switch-on";
	}

	return bDiv;
};

/**
 * ONOD Graph Class Bar Graph Update Function
 **/
Graph.prototype.barUpdate = function (newData, index) {
	var cData;
	if (!index) {
		index = this.lastIndex;
		cData = newData;
		this.gUpd = false;
	} else {
		cData = channelData(newData, index, this.altD);
		this.gUpd = true;
	}

	this.remove();
	
	if (this.altD) {
		this.create(this.gCvs, cData, null, null, this.gWd, this.gHt);
	} else {
		this.createBarGraph(this.gCvs, cData);
	}

	this.lastIndex = index;
	this.gUpd = false;
};

Graph.prototype.setColor = function (newColor) {
	if (newColor) {
		this.gColor = Object.prototype.toString.call(newColor) === '[object Array]' ? newColor : [newColor];
		this.gColor.push('transparent');
	}	
};

/**
 * ONOD Graph Class Set Graph Title Function
 * Parameters:
 *		-> gTitle = Main title to be displayed top center of the graph
 * 		-> xTitle = x-Axis title to be displ	ayed bottom center of the graph
 * 		-> yTitle = y-Axis title to be displayed vertically left of the graph
 **/
Graph.prototype.setTitles = function (gTitle, xTitle, yTitle) {
	if (gTitle !== undefined && gTitle != null) { this.gTtl.mT = gTitle; if(!this.gTtl.tSet) this.gTtl.tSet = true; }
	if (xTitle !== undefined && xTitle != null) { this.gTtl.xT = xTitle; if(!this.gTtl.tSet) this.gTtl.tSet = true; }
	if (yTitle !== undefined && yTitle != null) { this.gTtl.yT = yTitle; if(!this.gTtl.tSet) this.gTtl.tSet = true; }
};

/**
 * ONOD Graph Class Title Draw Function
 * Internal function to create defined graph main and axis titles
 **/
Graph.prototype.createGraphTitles = function (rData, tSca) {
	if (this.gTtl.tSet) {
		var that = this,
			tSca = tSca === undefined ? 1 : tSca;
		that.gTtlObjs = [];
		$.each(that.gTtl, function (key, item) {
			switch (key) {
				case "mT":
					that.gTtlObjs.push(rData.rObj.text(that.xPos + (that.gWd / 2), that.yPos - 22.5 * tSca, item).attr({'font-family': 'Arial, Sans-Serif', 'font-size': 16, 'font-weight': 'bold'}));
					break;
				case "xT":
					that.gTtlObjs.push(rData.rObj.text(that.xPos + (that.gWd / 2), that.yPos + that.gHt + 50 * tSca, item).attr({'font-family': 'Arial, Sans-Serif', 'font-size': 16, 'font-weight': 'bold'}));
					break;
				case "yT":
					that.gTtlObjs.push(rData.rObj.text(that.xPos - 30 * tSca, that.yPos + (that.gHt / 2), item).attr({'font-family': 'Arial, Sans-Serif', 'font-size': 16, 'font-weight': 'bold'}));
					that.gTtlObjs[that.gTtlObjs.length - 1].rotate(-90);
					break;
			}
		});
	}
}

/**
 * ONOD Graph Class Hide Graph Function
 **/
Graph.prototype.hide = function () {

};

/**
 * ONOD Graph Class Remove Graph Function
 **/
Graph.prototype.remove = function () {
	this.tags && this.tags.remove();
	this.bTxt && this.bTxt.remove();
	//if (this.altD && !this.altD) this.gObj.unhover();
	this.gObj.unhover && this.gObj.unhover();
	this.gObj.unhoverColumn && this.gObj.unhoverColumn(); 
	this.gObj && this.gObj.remove(); 
	this.gObj && this.gObj.clear();
	
	if (!this.gUpd) {
		if (this.gTtl.tSet && this.gTtlObjs)
			for (var i = 0; i < this.gTtlObjs.length; i++) {
				this.gTtlObjs[i].remove();
			}				
		this.gHideBtn && $(this.gHideBtn).remove();
		this.gGrid && this.gGrid.remove();
	}
};

/**
 * ONOD Graph Class Update Graph Data Function
 **/
Graph.prototype.update = function (rData, newData, xLabel) {
	xLabel = xLabel === undefined ? newData.time : xLabel;
	if (Object.prototype.toString.call(newData.data) === '[object Object]') {
		for (var i in newData.data) {
			if (Object.prototype.toString.call(newData.data[i]) === '[object Array]' && this.gCol != newData.data[i].length) {
				this.gCol = newData.data[i].length
				this.gUpd = false;
			} else {
				this.gUpd = true;
			}
			break;
		}		
	} else {
		if (this.gCol != newData.data.length) {
			this.gCol = newData.data.length
			this.gUpd = false;
		} else {
			this.gUpd = true;
		}
	}
	this.remove();
	this.create(rData, newData, xLabel, this.gHvrTagCfgStr);
	this.gUpd = false;
};

/**
 * ONOD Graph Class Visibility Check / Update
 **/
Graph.prototype.checkVis = function () {
	var gBox = this.gObj.getBBox(),
		dScr = $(this.gObj.paper.canvas).parent().scrollTop(),
		dHt  = $(this.gObj.paper.canvas).parent().height();

	if (dScr > gBox.y2 || dHt + dScr < gBox.y)
		this.gVis = false;
	else
		this.gVis = true;
};

/**
 * ONOD Graph Class Visibility Query
 **/
Graph.prototype.isVis = function () {
	return this.gVis;
};


/**
 * ONOD Raphael Canvas Class
 * Constructor Parameters:
 * 		-> destDiv = ID of HTML element to contain Raphael Canvas Object (without #)
 * 		-> cWd  = Width of canvas in pixels or percent (default: 100%)
 * 		-> cHt  = Height of canvas in pixels or percent (default: 100%)
 *		-> cMgX = Amount of horizontal margin space to remove due to navbar
 *		-> cMgY = Amount of vertical margin space to remove due to header/footer
 *
 * Public Member Variables:
 *		-> rObj = Object containing created Raphael canvas
 * 		-> pWd  = Calculated width of the div canvas is contained within
 * 		-> pHt  = Calculated height of the div canvas is contained within
 *		-> gObj = Container Array to keep track of Graph Objects
 *		-> cRsz = Variable to hold the timeout for browser / canvas resize event
 **/
function Canvas (destDiv, cWd, cHt, cMgX, cMgY) {
	this.dDiv = destDiv === undefined ? 'oPlace' : destDiv;
	this.cMgX  = cMgX === undefined ? 237 : cMgX;
	this.cMgY  = cMgY === undefined ? 96 : cMgY;
	this.pWd  = cWd === undefined ? $(window).width() - this.cMgX : cWd;
	this.pHt  = cHt === undefined ? $(window).height() - this.cMgY : cHt;
	this.rObj = Raphael(this.dDiv, this.pWd, this.pHt);
	this.gObj = [];
	this.cObj = [];

	var that = this;
	$("#" + this.dDiv).scroll(that, function () {
		that.onScroll();
	});
}

/**
 * ONOD Canvas Class Set Dimensions Function
 * Parameters:
 *		-> cHeight = New height to assign to canvas in pixels or % (Default: height of canvas parent div)
 *		-> cWidth = New width to assign to canvas in pixels or % (Default: 100%)
 **/
Canvas.prototype.setDim = function (cHeight, cWidth) {
	cHeight = cHeight === undefined ? $(this.rObj.canvas).outerHeight() : cHeight;
	cWidth = cWidth === undefined ? (this.pWd < 640 ? $(this.rObj.canvas).outerWidth() : this.pWd) : cWidth;
	this.rObj.setSize(cWidth, cHeight);
	$(this.rObj.canvas).parent().height(this.pHt);
	if (this.cObj.length) $(this.cObj[0].rObj.canvas).parent().height(this.pHt + this.cMgY - this.cObj[0].cMgY);
};

/**
 * ONOD Canvas Class Dimensions Update Function
 * This function simply re-scans and stores the canvas parent div width and height.
 **/
Canvas.prototype.updateDim = function () {
	this.pWd  = $(window).width() - this.cMgX;
	this.pHt  = $(window).height() - this.cMgY;
};

/**
 * ONOD Canvas Class Container Div Scroll Handle Function
 * This function will determine whether a graph on the canvas is visible
 **/
 Canvas.prototype.onScroll = function () {
 	if ($(this).is(":visible") && this.gObj.length) {
 		var visibleGraph = [];
 		$.each(this.gObj, function (key) {
			this.checkVis();
			if (this.isVis()) {
				visibleGraph.push(key);
			}
 		});
 		this.gVis = visibleGraph;
 	}
 };

 Canvas.prototype.push = function (destDiv, cWd, cHt, cMgX, cMgY) { 	
 	if (destDiv) {
 		this.cObj.push({dDiv: this.dDiv, cMgX: this.cMgX, cMgY: this.cMgY, pWd: this.pWd, pHt: this.pHt, rObj: this.rObj});
 		this.dDiv = destDiv;
		this.cMgX = cMgX === undefined ? 17 : cMgX;
		this.cMgY = cMgY === undefined ? 17 : cMgY;
		this.pWd  = cWd === undefined ? $(this.dDiv).width() - this.cMgX : cWd;
		this.pHt  = cHt === undefined ? $(this.dDiv).height() - this.cMgY : cHt;
		this.rObj = Raphael(this.dDiv, this.pWd, this.pHt);
		return this.cObj.length - 1;
 	} else {
 		return -1;
 	}
 };

 Canvas.prototype.pop = function(index) {
 	var prevC = this.cObj.pop();

 	if (prevC) {
 		this.dDiv = prevC.dDiv;
		this.cMgX = prevC.cMgX;
		this.cMgY = prevC.cMgY;
		this.pWd  = prevC.pWd;
		this.pHt  = prevC.pHt;
		this.rObj = prevC.rObj;

		this.updateDim();
		this.setDim();
		return 1;
 	} else {
 		return 0;
 	}
 };

/**
 * ONOD Canvas Class Hide Canvas Function
 * This function will use jQuery to hide this canvas if visible.
 **/
Canvas.prototype.hide = function () {
	if ($(this.rObj.canvas).is(":visible") ) {
		$('#' + this.dDiv)[0].scrollIntoView(true);
		$(this.rObj.canvas).hide();
	}
};

/**
 * ONOD Canvas Class Show Canvas Function
 * This function will use jQuery to show this canvas if invisible.
 **/
Canvas.prototype.show = function () {
	if (!$(this.rObj.canvas).is(":visible") || this.rObj.canvas.style.display == "none") {
		$(this.rObj.canvas).show();
	}
};


function oInit () {
/**
 * new Canvas ( destDiv = ID of HTML element to contain Raphael Canvas Object (without #),
 *				cWd  = Width of canvas in pixels or percent (Default: 100%),
 *				cHt  = Height of canvas in pixels or percent (Default: 100%),
 *				cMgX = Amount of horizontal margin space to remove due to navbar (Default: 237px),
 *				cMgY = Amount of vertical margin space to remove due to header/footer (Default: 91px) );
 **/
 	var logStorage = {};
	var oCanvas = new Canvas ();
	var rClass = new JSON(logStorage);
	oCanvas.setDim(oCanvas.pHt - 5);

	var oDash = new oGroup (oCanvas, 2, 0)
	var oBat = new oGroup (oCanvas, 0, 1);
	var oSNR = new oGroup (oCanvas, 0, 2);
	var oWScan = new oGroup (oCanvas, 1, 3);
	var oRSSI = new oGroup (oCanvas, 0, 4);

	var refList = {
		0 : {url: ["/log/batman_log.json", "/log/assoc_log.json"], oGrp: oDash},
		1 : {url: "/log/batman_log.json", oGrp: oBat},
		2 : {url: "/log/assoc_log.json", oGrp: oSNR},
		3 : {url: "/log/scan_log.json", oGrp: oWScan},
		4 : {url: "/log/assoc_log.json", oGrp: oRSSI}
	}	
	var hRef = {
		0 : {url: "/log/bathosts_log.json", oGrp: null}
	}

	var anRef = {
		0 : {url: "/log/announce_log.json", oGrp: null}
	}
	var aDisp = new Dispatcher (anRef, new JSON(logStorage), 120000);
	var hDisp = new Dispatcher (hRef, new JSON(logStorage), 120000);
	var eventData = {
		oDisp: new Dispatcher (refList, new JSON(logStorage), 5000),
		oLua: new Lua ()
	}

	var rData = {oCanvas: oCanvas, oDisp: eventData.oDisp};
	$(window).resize(rData, function () {
		clearTimeout(rData.oCanvas.cRsz);
		rData.oCanvas.cRsz = setTimeout(function () {
			rData.oCanvas.updateDim();
			rData.oCanvas.setDim();
			if($(rData.oCanvas.rObj.canvas).width() > 640)
				if (!rData.oDisp.blockFlg) {
					rData.oDisp.forceUpdate();
				} else {
					console.log('async error');
					setTimeout(function() { $(window).resize(); }, 75);
				}				
		}, 125);
	});

	$("#side li").click(eventData, function () {
		self.uiBlockFlg == true;
		if(!self.uiBlockFlg) {
			if(eventData.oDisp.setActive(this.value) != null) {
				$(this.parentElement.children).each(function() { 
					if ($(this).hasClass('active')) {
						$(this).removeClass('active');
					}
				});

				$(this).addClass('active');
			}
		}
		function waitTimer () {	
			self.uiBlockFlg = false;
		}
		setTimeout(waitTimer, 50);
	
	});

	$("#cogMenu > li").click(eventData, function () { 
		switch (Number(this.value)) {
			case 1:
				eventData.oLua.start();
			break;

			case 2:
				eventData.oLua.stop();
			break;

			case 3:
				eventData.oLua.restart(1);
			break;

			case 4:
				eventData.oDisp.stopInterv();
				$('#myModal').modal('show');
			break;			
				
		}		
	});
	
	$("#logSetFooter > button").click(eventData, function () { 
		switch(Number(this.value)) {
			case 0:
				eventData.oDisp.startInterv();
				$('#myModal').modal('hide');
			break;
			
			case 1:
				$("#loggerForm").submit();
			break;
			
			case 2: 
				$("#loggerForm").submit();
				eventData.oDisp.startInterv(1);
				eventData.oLua.restart(0);
				$('#myModal').modal('hide');
			break;

		}
	});


	$("input[name*='checkboxes-settings']").click(eventData, function () {
		if(this.value == "runForever") {
			if($(this).is(':checked')) 
				$('#rTime').prop('disabled', true);
			else
				$('#rTime').prop('disabled', false);
		}
	});

	$("input[name*='checkboxes-dataType']").click(eventData, function () {
		var i = 0;
		$("input[name*='checkboxes-dataType']").each(function(index, Element) {
			if($(this).is(':checked'))
				i++;
		});
		if(i > 0)
			$('.settingBut').prop('disabled', false);
		else
			$('.settingBut').prop('disabled', true);
	});

	$("#loggerForm").submit(eventData, function() {
		
		function processForm (form) {
			var formObj = { 
				sInterv : Number(form.sInterv.value), 
				lLen : Number(form.lLen.value),
				dataTypes : [],
				rTime : $('#checkboxes-settings-rF').is(':checked') ? 0 : Number(form.rTime.value),
				resetLog : $('#checkboxes-settings-cL').is(':checked') ? 1 : 0
			}
			$("input[name*='checkboxes-dataType']").each(function(index, Element) {
				if($(this).is(':checked'))
					formObj.dataTypes.push(this.value); 
			});

			if(formObj.dataTypes.length == 0) {
				formObj.dataTypes = null;
			}
		
			console.log(formObj)
			return formObj;
		}
		formObj = processForm(this);
		eventData.oLua.updateLogSet(formObj.sInterv, formObj.rTime, formObj.lLen, formObj.dataTypes, formObj.resetLog);
		return false;
	});
	$('.settingBut').tooltip();
	return eventData.oDisp;
}

$(document).ready(function() {
	oInit ();
});