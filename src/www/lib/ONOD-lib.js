function getItem (fromObj, key) {
	var current = fromObj;
    for (var i = 0; i < key.length; i++) {
        if(current[key[i]]) {
            current = current[key[i]];
        } else {
            return null;
        }
    }

    return current;
}

function channelData (newData, index, lineG) {
	index = index === undefined ? newData.length : index;
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
		if (!cData.count[i])  {
		if (!cData.count[i]) cData.count[i] = 0;
		} else cData.total += cData.count[i];
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
	var str = dataArr[0];
	for (var i = 1; i < dataArr.length; i++) {
		str = str + "," + dataArr[i];
	};
	console.log(str);
	return str;
};

Lua.prototype.updateLogSet = function(sleepTime, runTime, maxLn, dataTypes, resetLog) {
	if (sleepTime !== undefined)
		this.sleepTime = sleepTime;
	if (runTime !== undefined)
		this.runTime = runTime;
	if (maxLn !== undefined)
		this.maxLn = maxLn;
	if (dataTypes !== undefined && dataTypes != null)
		this.dataTypes = dataTypes;
	if (resetLog !== undefined)
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
	this.hname = window.location.hostname;
	try
	{	
		if (this.blockFlg) throw "Dispatcher Blocked";
		this.blockFlg = true;
		if (this.aRef) {
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
			if (self.blockFlg) throw "Dispatcher Blocked";
			self.blockFlg = true;
			self.getData()}
		catch(err)
		{
			console.log(err);
			return null;
		}
	}, mSecs);
};

/**
 * ONOD Dispatcher Class Update Timeout Function
 * Parameters: 
 *		-> mSecs = Interval in seconds between data re-poll (Client-side) (Default: 5 seconds)
 **/
Dispatcher.prototype.updateTimeout = function(mSecs) {
	this.mSecs = mSecs === undefined ? 5000 : mSecs;
	if (this.aRef) 
		this.interv = this.intervalUpdate(this.mSecs);
	else 
		console.log("Ref is null, can not Start.");
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
		if (this.blockFlg) 
			throw "Dispatcher Blocked";
		this.blockFlg = true;
		if (tempRef) {
			if (this.aRef) 
				this.aRef.oGrp.removeGroup();
			this.aRef = this.refList[id];
			this.getData(true);
			this.interv = this.intervalUpdate(this.mSecs);
		} else 
			throw "Err: ref is null";

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
	if (this.aRef) 
		this.interv = this.intervalUpdate(this.mSecs);
	else 
		console.log("Ref is null, can not Start.");
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
Dispatcher.prototype.updateRefList = function(refList) {
	this.refList = refList;
};

Dispatcher.prototype.addRef = function(ref) {
	this.refList.push(ref);
};

Dispatcher.prototype.forceUpdate = function () {
	try
	{	
		if (this.blockFlg) 
			throw "Dispatcher Blocked";
		this.blockFlg = true;
		clearInterval(this.interv);
		if (this.aRef) 
			this.aRef.oGrp.removeGroup();
		this.getData(true);
		this.interv = this.intervalUpdate(this.mSecs);
	}
	catch(err)
	{
		console.log(err);
	}
};

Dispatcher.prototype.updateHost = function (hname) {
	if (this.blockFlg)
		return false;
	else {
		this.blockFlg = true;
		this.hname = hname;
		clearInterval(this.interv);
		if (this.aRef) 
			this.aRef.oGrp.removeGroup();
		this.getData(true);
		this.interv = this.intervalUpdate(this.mSecs);
		return true;
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
JSON.prototype.getLogRequests = function(hname, aRef, fUpd) {
	var self = this, dObj = [];
	if (Object.prototype.toString.call(aRef.url) === '[object Array]') {
		$.each(aRef.url, function (key, element) {
			dObj.push(self.fetchNewData(hname, element, fUpd));
		});
		return dObj;
	} else {
		dObj.push(self.fetchNewData(hname, aRef.url, fUpd));
		return dObj;
	}
};

JSON.prototype.startFetch = function(oDisp, aRef, fUpd) {
	var self = this; self.aRef = aRef; self.oDisp = oDisp;
	var fetchData = $.when.apply($, this.getLogRequests(oDisp.hname, aRef, fUpd));

	fetchData.done(function () {
		function processFetch (url, data, jqXHR, fUpd) {
			if (jqXHR.statusText == "OK") {
				self.updateLog(url, data);
				self.processData(self.oDisp, self.aRef, data);
			} else if (jqXHR.statusText == "Not Modified" && fUpd) {
				self.processData(self.oDisp, self.aRef, self.getLog(url));
			} else 
				self.oDisp.disUnblock();
		}

		function processMFetch (dataArr) {
			var newData = [], flag = false;
			$.each(dataArr, function (key, element) {
				if (this[2].statusText == "OK") {
					self.updateLog(this[0], this[1]);
					newData.push(this[1]);
					flag = true;
				} else if (this[2].statusText == "Not Modified" && this[3]) {
					newData.push(self.getLog(this[0]));
					flag = true;
				} else 
					self.oDisp.disUnblock();
			});

			if (flag) 
				self.processData(self.oDisp, self.aRef, newData);
		}

		if (Object.prototype.toString.call(arguments[0]) === '[object Array]')
			processMFetch(arguments);
		else 
			processFetch(arguments[0], arguments[1], arguments[2], arguments[3]);
	});

	fetchData.fail(function () {
		self.oDisp.disUnblock();
	});
};

JSON.prototype.fetchNewData = function (hname, url, fUpd) {
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
			if (jqXHR.status != 404)
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
		self.processJSON(oGrp, tID, data, d2);
	}

	var self = this, d = $.Deferred(), d2 = $.Deferred();

	d2.done(function (oGrp, dataSeries) {
		oGrp.updateGroup(dataSeries, d, self.getLog("/log/bathosts_log.json"));
	});
	d.done(function () {
		self.oDisp.disUnblock();
	})

	d.fail(function () {
		self.oDisp.disUnblock();
	})

	if (aRef.oGrp !== null) {
		dProcess(aRef.oGrp, aRef.oGrp.tID, data);
	} else 
		d.resolve();
};

JSON.prototype.getLog = function(url) {
	var id = this.hashCode(url);
	if (this.logStorage[id] == undefined) {
		return null;
	} else 
		return this.logStorage[id].data;
};

JSON.prototype.hashCode = function(url) {
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

	if (flag)
		this.logStorage[hashCode] = {hashCode: hashCode, data: data};
	else
		console.log("HashCode Clash!!!");
};

JSON.prototype.updateLog = function (url, data) {
	var obj = this.getLog(url);
	if (obj == null) 
		this.addLog(url, data);
	else 
		obj.data = data;
};

JSON.prototype.processJSON = function (oGrp, jID, jData, d) {
	function getTime (timestamp) {
			var date = timestamp.split(/(?:\s+)/g);
			return {day: date[0], month: date[1], date: date[2], time: date[3], year: date[4]};
	}

	function oDashConvert (log) {
		function mergeData (oldData, newData) {
			var mergedData = $.extend(true, oldData, newData); 
			return mergedData;
		}

		function processLog () {
			var deferred = $.Deferred();

			if (logEntry.items[0].originNodes !== undefined) {
				bScoreConvert(logEntry, deferred);
			} else {
				var dRSSI = $.Deferred(), dSNR = $.Deferred(), tmp = {};
				var shDeferred = $.when(dSNR, dRSSI).done(function () {
					tmp = mergeData(arguments[0], arguments[1]);
					deferred.resolve(tmp);
				});

				aListConvert(logEntry, dSNR);
				RSSIConvert(logEntry, dRSSI);
			}

			deferred.done(function (pData) {
				if (++x < dCount) {
					dataSeries = mergeData(dataSeries, pData);
					logEntry = log[x];
					setTimeout(processLog, 0);
				} else {
					dataSeries = mergeData(dataSeries, pData);
					d.resolve(oGrp, dataSeries);
				}
			});
		}

		var dataSeries = {}, logEntry;

		if (log != null) { 
			var dCount = log.length, x = 0;
			logEntry = log[x];
			setTimeout(processLog, 0);
		} else 
			d.reject();
	}

	function bScoreConvert (log, deferred) {
		function processLog () {
			function processBSEntry(key, time, bScore, ls) {
				var flag = dataSeries[key] === undefined ? true : false;

				if (flag) {
					dataSeries[key] = {mac: key, time: [time], data: {bScore: [bScore]}, ls: [ls]};
				} else {
					dataSeries[key].time.push(time);
					dataSeries[key].data.bScore.push(bScore);
					dataSeries[key].ls.push(ls);					
				}
			}
			
			var time = getTime(logEntry.time);
			for (var y = 0; y < logEntry.originNodes.length; y++) {
				var data = logEntry.originNodes[y];
				processBSEntry(data[0], time, data[2], data[1]);
			}
			
			if (++i < dCount) {
				logEntry = log.items[i];
				setTimeout(processLog, 0);
			} else if(deferred === undefined)
				d.resolve(oGrp, dataSeries);
			else {
				deferred.resolve(dataSeries);
			}
		}

		var dataSeries = {};
		if (log != null) { 
			var dCount = log.items.length, i = 0;
			var logEntry = log.items[i];
			setTimeout(processLog, 0);
		} else 
			d.reject();
	}

	function aListConvert (log, deferred) {
		function processLog () {
			function processSNREntry(key, time, signal, noise) {
				var flag = dataSeries[key] === undefined ? true : false;

				if (flag) {
					dataSeries[key] = {mac: key, time: [time], data: {signal: [signal], noise: [noise]}, snr: [signal - noise]};
				} else {
					dataSeries[key].time.push(time);
					dataSeries[key].data.signal.push(signal);
					dataSeries[key].data.noise.push(noise);
					dataSeries[key].snr.push(signal - noise);
				}
			}

			var time = getTime(logEntry.time);
			for (var key in logEntry.data) {
				if (logEntry.data.hasOwnProperty(key)) {
					var dataEntry = logEntry.data[key];
					processSNREntry(key, time, dataEntry.signal, dataEntry.noise);
				}
			}
			if (++i < dCount) {
				logEntry = log.items[i];
				setTimeout(processLog, 0);
			} else if (deferred === undefined)
				d.resolve(oGrp, dataSeries);
			else {
				deferred.resolve(dataSeries);
			}
		}
		var dataSeries = {};

		if (log != null) { 
			var dCount = log.items.length, i = 0;
			var logEntry = log.items[i];
			setTimeout(processLog, 0);
		} else 
			d.reject();
	}

	function wScanConvert (log) {
		var dataSeries = [];
		$.each(log.items, function(key) {
			var date = this.time.split(/(?:\s+)/g);
			var time = {day: date[0], month: date[1], date: date[2], time: date[3], year: date[4]};
			
			dataSeries.push({time: time, data: this.wScan});
		});

		d.resolve(oGrp, dataSeries);
	}

	function RSSIConvert (log, deferred) {
		function generateRSSI (signal, noise) {
			return (signal - noise);
		}
		
		function processLog () {
			function processRSSIEntry(key, time, signal, noise) {
				var flag = dataSeries[key] === undefined ? true : false;

				if (flag) {
					dataSeries[key] = {mac: key, time: [time], data: {rssi: [generateRSSI(signal, noise)]}};
				} else {
					dataSeries[key].time.push(time);
					dataSeries[key].data.rssi.push(generateRSSI(signal, noise));
				}
			}

			var time = getTime(logEntry.time);
			for (var key in logEntry.data) {
				if(logEntry.data.hasOwnProperty(key)) {
					var dataEntry = logEntry.data[key];
					processRSSIEntry(key, time, dataEntry.signal, dataEntry.noise);
				}
			}
		
			if (++i < dCount) {
				logEntry = log.items[i];
				setTimeout(processLog, 0);
			} else if(deferred === undefined)
				d.resolve(oGrp, dataSeries);
			else {
				deferred.resolve(dataSeries);
			}
		}
		var dataSeries = {};

		if (log != null) { 
			var dCount = log.items.length, i = 0;
			var logEntry = log.items[i];
			setTimeout(processLog, 0);
		} else d.reject();
	}

	function annConvert (log) {
		d.resolve(oGrp, log);
	}

	var newData;
	switch (jID) {
		case -1: 
			newData = annConvert(jData);
		break;
		
		case 0:
			newData = oDashConvert(jData);
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
			d.reject();
		break;
	}
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

oGroup.prototype.updateGroup = function (newData, d, hosts) {
	function getHostName (mac) {
		var noHost = "Node";
		if (!hosts) return noHost;
		if (hosts[mac] === undefined) 
		 	return noHost;
		 else 
		 	return hosts[mac].hName;
	}

	function createGraph (cObj, gProps, gColor, gHvrTagCfgStr, gTitleObj, gData) {
		var gObj = new Graph (gProps.xPos, gProps.yPos, gProps.gRows, gProps.gCols, gProps.gMaxYval, gColor),
			gDta = gData === undefined ? newData[dKey[i]] : gData;
		gObj.setTitles(gTitleObj.mTitle, gTitleObj.xTitle, gTitleObj.yTitle);
		gObj.create(cObj, gDta, gDta.time, gHvrTagCfgStr, gProps.gWidth, gProps.gHeight);
		return gObj;
	}

	function processDash() {
		function createPanelGroup (loc) {
			divGPanel = document.createElement("div");
			divGPanLoc = document.getElementById(loc);
			divGPanel.className = "panel-group";
			divGPanel.id = "oDash";
			divGPanLoc.appendChild(divGPanel);
		}

		function createPanel (loc, heading, id) {
			var divPanel = document.createElement("div"),
				divPHeading = document.createElement("div"),
				h4PTitle = document.createElement("h4"),
				divPColl = document.createElement("div"),
				divPBody = document.createElement("div");

			/* create inital Panel div*/
			divPanel.className = "panel panel-default";

			/* create the Panel headingv*/
			divPHeading.className = "panel-heading";
			h4PTitle.className = "panel-title";		        
			h4PTitle.innerHTML = '<a class="accordion-toggle" data-toggle="collapse" data-parent="#oDash" href="#collapse-' + id + '" value="' + heading + '">' + getHostName(heading.toLowerCase()) + " (" + heading + ")" + '</a>';

			/* create the Panel Body */
			divPColl.id = "collapse-" + id;
			divPColl.className = "panel-collapse collapse in";
			divPBody.className = "panel-body";
			$(divPBody).css({'position': "relative", 'overflow': "auto", 'padding': 0, 'background-color': "#efefef"});

			/* Bind Everything together */
			loc.appendChild(divPanel);
			divPanel.appendChild(divPHeading);
			divPHeading.appendChild(h4PTitle);
			divPanel.appendChild(divPColl);
			divPColl.appendChild(divPBody);

			return {loc: divPBody, coll: divPColl};
		}

		function processGraphs () {
			function createGraphs (key) {
				var gLoc = createPanel(divGPanel, key, i),
					gCvs = new Canvas (gLoc.loc, null, 400, 254, 0);
				var	gTitlesA = {mTitle: "Node Batman Quality", xTitle: "Time (HH-MM-SS)", yTitle: "Score (0 - 255)"},
					gTitlesB = {mTitle: "Node Signal / Noise", xTitle: "Time (HH-MM-SS)", yTitle: "dB (-100 - 0)"},
					gTitlesC = {mTitle: "RSSI", xTitle: "Time (HH-MM-SS)", yTitle: "dB (0 - 120)"};
				var	gHvrTagCfgStrA = 'timestamp br L="Batman Quality Score" D=0 br P="ls" L="Node Last Seen" sp T="(s)"',
					gHvrTagCfgStrB = 'timestamp br L="Signal" D=0 sp L="Noise" D=1 br P="snr" L="SNR" sp T="(dB)"',
					gHvrTagCfgStrC = 'timestamp br L="Recieved Signal Strength Indicator" D=0 br';
				var	gDta = newData[key],
					gDtaA = {data: {bScore: gDta.data.bScore}, mac: key, time: gDta.time, ls: gDta.ls},
					gDtaB = {data: {signal: gDta.data.signal, noise: gDta.data.noise}, mac: key, time: gDta.time, snr: gDta.snr},
					gDtaC = {data: {signal: gDta.data.rssi}, mac: key, time: gDta.time, snr: gDta.snr};
				var	gProps = { xPos: 75, yPos: 50, 
							   gWidth: null, gHeight: null, gMaxYval: 260,
							   gRows: 13, gCols: newData[key].time.length
							 };

				var	gObjA = createGraph(gCvs, gProps, null, gHvrTagCfgStrA, gTitlesA, gDtaA);
				gProps.yPos = gObjA.yPos + gObjA.gHt * 2; gProps.gRows = 10; gProps.gMaxYval = -100;
				var	gObjB = createGraph(gCvs, gProps, [null, '#f00'], gHvrTagCfgStrB, gTitlesB, gDtaB);
				gProps.yPos = gObjB.yPos + gObjA.gHt * 2; gProps.gRows = 12; gProps.gMaxYval = 120;
				var	gObjC = createGraph(gCvs, gProps, null, gHvrTagCfgStrC, gTitlesC, gDtaC);

				gCvs.gObj = [gObjA, gObjB, gObjC];
				gCvs.setDim(gObjA.gHt * 2 + gObjB.gHt * 2 + gObjC.gHt * 3);

				if (i > 0) {
					$(gLoc.coll).attr("class", "panel-collapse collapse");
				}

				self.dCvs[key] = gCvs;
			}
		
			function updateGraphs(key) {
				var	gDta = newData[key],
				uDta = [];
				uDta.push(null);
				if (gDta.data.bScore !== undefined) {
					uDta.push({data: {bScore: gDta.data.bScore}, mac: key, time: gDta.time, ls: gDta.ls});
				} else uDta.push(null); 
				 
				if (gDta.data.signal !== undefined) {
					uDta.push({data: {signal: gDta.data.signal, noise: gDta.data.noise}, mac: key, time: gDta.time, snr: gDta.snr});
				} else uDta.push(null);

				if (gDta.data.rssi !== undefined) {
					uDta.push({data: {signal: gDta.data.rssi}, mac: key, time: gDta.time, snr: gDta.snr});
				} else uDta.push(null);

				var index = 0;
				for(var c in self.dCvs[key].gObj) {
					var pClass = self.dCvs[key].dDiv.parentElement.className;
					if (pClass.substring(pClass.length - 2, pClass.length) === "in" && ! self.dCvs[key].gObj[c].gHid) {
						if(uDta[index] == null) continue;
						self.dCvs[key].gObj[c].update(self.dCvs[key], uDta[index]);
					}
					index++;
				}
			}
			
			/* For each MAC address in the data, create a new panel or update an existing one */
			if ($('#oDash').find("[value='" + dKey[i] + "']").length) {
				updateGraphs(dKey[i]);
			} else {
				createGraphs(dKey[i]);
			}


			if (++i < dCount) 
				setTimeout(processGraphs, 0);
			else 
				d.resolve();
		}

		if (self.dCvs === undefined) self.dCvs = {};

		/* Test if there is an existing Panel Group, if not create one*/
		var divGPanel, divGPanLoc = document.getElementById("oPlace");
		if ($('#oDash').length) {
		 	divGPanel = document.getElementById("oDash");
    	} else 
    		createPanelGroup("oPlace");

    	setTimeout(processGraphs, 0);
	};

	function processGraph () {
		if (self.cObj.gObj[i]) {
			if (self.cObj.gObj[i].gHid) 
				mSpa += self.cObj.gObj[i].gHt * 1.5;
			else 
				self.cObj.gObj[i].update(self.cObj, newData[self.cObj.gObj[i].gMAC]);
		} else {
			var gTitles = {mTitle: getHostName(dKey[i].toLowerCase()) + " (" + dKey[i] + ")", xTitle: "Time (HH-MM-SS)", yTitle: null},
				gProps = { xPos: 75, yPos: 50 + (self.gSpa * i), 
						   gWidth: null, gHeight: null, gMaxYval: null,
						   gRows: 13, gCols: newData[dKey[i]].time.length
						 };

			var gObj;
			switch (self.tID) {
				case 1:
					var gHvrTagCfgStr = 'timestamp br L="Batman Quality Score" D=0 br P="ls" L="Node Last Seen" sp T="(s)"';
					gTitles.yTitle = "Score (0 - 255)"; gProps.gMaxYval = 260;
					gObj = createGraph(self.cObj, gProps, gColors[i], gHvrTagCfgStr, gTitles)
				break;
				
				case 2:
					var gHvrTagCfgStr = 'timestamp br L="Signal" D=0 sp L="Noise" D=1 br P="snr" L="SNR" sp T="(dB)"';
					gTitles.yTitle = "dB (-100 - 0)"; gProps.gMaxYval = -100; gProps.gRows = 10; 
					gObj = createGraph(self.cObj, gProps, [gColors[i], "#f00"], gHvrTagCfgStr, gTitles)		
				break;

				case 4: 
					var gHvrTagCfgStr = 'timestamp br L="Recieved Signal Strength Indicator" D=0 br';
					gTitles.yTitle = setYTitles = "dB (0 - 120)"; gProps.gMaxYval = 120;
					gObj = createGraph(self.cObj, gProps, gColors[i], gHvrTagCfgStr, gTitles)
				break;
			}
			self.cObj.gObj.push(gObj);
		}

		if (++i < dCount) {
			setTimeout(processGraph, 0);
		} else if (self.cFlg === 0) {
			self.cObj.setDim(self.gSpa * dCount - mSpa);
			d.resolve();
		} else 
			d.resolve();
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
			if (self.gLine) {
				self.tObj.gObj.altD = true;
				if (self.cRef === undefined) {
					self.tObj.processLineColors(cDta);
					self.cRef = self.tObj.gColors;
				} else
					self.tObj.gColors = self.cRef;
				self.tObj.updateRowColor();
				self.tObj.gObj.setColor(self.tObj.gColors.cArr);
				self.tObj.gObj.setTitles("WiFi AP Channel Information", "Channel", "Signal Strength (dBm)");				
			} else {
				self.tObj.gObj.altD = false;
				var gColors = ["#2f69bf", "#a2bf2f", "#bf5a2f", "#bfa22f", "#772fbf", "#bf2f2f", "#00327f", "#667f00", "#7f2600", "#7f6500"];
				self.tObj.gObj.setColor(gColors);
				self.tObj.gObj.setTitles("WiFi AP Channel Information", "Channel", "AP #");		
			}
		}		


		if (self.tObj) {
			self.tObj.update(newData);
		} else {
			self.aIndex = self.aIndex === undefined ? newData.length - 1 : self.aIndex;
			self.gLine = self.gLine === undefined ? true : self.gLine;

			var tCfg = { ssid: "SSID", bssid: "BSSID", mode: "Mode", 'encryption': "Encryption", quality: "Quality", signal: "Signal", channel: "Channel" }
				tObj = new Table (self.cObj.dDiv);
			tObj.create(tCfg, newData, self.aIndex);
			self.tObj = tObj;

			var oldCvs = self.cObj.push(self.tObj.cDiv), 
				gCols = self.gLine ? 15 : 11, 
				gObj, cDta;
			
			cDta = channelData(newData, self.aIndex, self.gLine);
			gObj = new Graph (50, 50, 10, gCols, -100);
			self.tObj.gObj = gObj;

			processChannelGraphs();

			if (self.gLine) {
				gObj.create(self.cObj, cDta, null, null, self.cObj.pWd * 0.9, self.cObj.pHt * 0.6);
			} else {
				gObj.createBarGraph(self.cObj, cDta);
			}

			gObj.lastIndex = self.aIndex;

			var gSwitch = gObj.switchGraphBtn(self.gLine);

			$(gSwitch).on('switch-change', function () {
				self.gLine = self.gLine ? false : true;
				cDta = channelData(newData, self.aIndex, self.gLine);
				processChannelGraphs();
				self.tObj.gObj.barUpdate(cDta);
				self.tObj.updateRowColor();
			});
			
			self.cObj.cObj[oldCvs].rObj.canvas.style.display = "none";
		}

		d.resolve();
	}

	if (newData != null) { 
		var dKey = Object.prototype.toString.call(newData) === '[object Object]' ? Object.prototype.constructor.keys(newData) : null,
			dCount = dKey ? dKey.length : newData.length,
			self = this, i = 0;

		switch (this.cFlg) {
			case 0:
				var gColors = ['#3f72bf', '#50e7f7', '#11f4c8'], mSpa = 0;
				this.cObj.show();
				this.gSpa = this.cObj.pHt * 0.5 < 312 ? 312 : this.cObj.pHt * 0.5;
				setTimeout(processGraph, 0);
			break;

			case 1:
				processTable();
			break;

			case 2: 
				this.cObj.hide();
				processDash();
			break;

			case 3:
				processCustom();
			break;

			default:
				d.resolve();
			break;
		}		 
	} else {
		d.reject();
	}
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
			this.aIndex = this.tObj.gObj.lastIndex;
			this.cRef = this.tObj.gColors;
			this.cObj.pop();
			this.tObj.remove();
			this.tObj = null;
		break;

		case 2:
			$("#oDash").remove();
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

Table.prototype.create = function (tConf, newData, index) {
	var tLoc = document.getElementById(this.dDiv),
		oTbl = document.createElement("div"),
		tHTML = document.createElement("table");

	index = index === undefined ? newData.length - 1 : index;
	
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

		var cIndex = newData.length - 1 - index;
		tNav.children[cIndex].className = "active";
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
			if (that.gObj.altD) {
				that.processLineColors(channelData(newData, this.value, true));
				that.updateRowColor();
			}
			that.gObj.barUpdate(newData, this.value);
		});

		tLoc.appendChild(nDiv);
		tNav.children[cIndex].scrollIntoView(true);
		this.tNav = nDiv;
	}

	this.update(newData, index);
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
			if (tObj.gObj.altD) {
				tObj.processLineColors(channelData(cData.tDta, this.value, true));
				tObj.updateRowColor();
			}
			tObj.gObj.barUpdate(cData.tDta, this.value);
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

Table.prototype.processLineColors = function (cDta) {
	var that = this;
	if (this.gColors === undefined) {
		this.gColors = {}, this.gColors.cArr = [];
		$.each(cDta.aData, function (channel) {
			$.each(this, function (bssid) {
				var newColor = '#'+('00000'+(Math.random()*(1<<24)|0).toString(16)).slice(-6);
				that.gColors[bssid] = newColor;
				that.gColors.cArr.push(newColor);
			});
		});
	} else {
		var newColorObj = {}; newColorObj.cArr = [];
		$.each(cDta.aData, function (channel) {
			$.each(this, function (bssid) {
				if (that.gColors[bssid]) {
					var oldColor = that.gColors[bssid]
					newColorObj[bssid] = oldColor;
					newColorObj.cArr.push(oldColor);
				} else {
					var newColor = '#'+('00000'+(Math.random()*(1<<24)|0).toString(16)).slice(-6);
					newColorObj[bssid] = newColor;
					newColorObj.cArr.push(newColor);
				}					
			});
		});
		this.gColors = newColorObj;
		this.gObj && this.gObj.setColor(this.gColors.cArr);
	}
};

Table.prototype.updateRowColor = function () {
	var tRows = $(this.oTbl.firstChild.lastChild).children(), that = this;
	$.each(tRows, function () {
		var ssidObj = this.children[1], bssidObj = this.children[2],
			bssid = bssidObj.innerHTML,	
			rowColor = that.gObj.altD ? that.gColors[bssid] : '#000';

		ssidObj.style.fontWeight = that.gObj.altD ? "900" : "normal";
		bssidObj.style.fontWeight = that.gObj.altD ? "900" : "normal";
		ssidObj.style.color = rowColor;
		bssidObj.style.color = rowColor;
	});
};

Table.prototype.remove = function () {
	$(this.oTbl).remove();
	$(this.cDiv).remove();
	$(this.tNav).remove();
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
	this.processColor(gColor);
	this.gBdr = gBdr === undefined ? 20 : gBdr;
	this.gTtl = {tSet: false};
	this.gUpd = false;
	this.gHid = false;
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

	// Internal function borrowed from gRaphael Source Code Here  -  https://github.com/DmitryBaranovskiy/g.raphael/blob/master/g.line.js
	function createColumns () {
		function snapEnds (from, to, steps) {
			 function round(a) {
	            return Math.abs(a - .5) < .25 ? ~~(a) + .5 : Math.round(a);
	        }

	        var f = from, t = to;
	        if (f == t) return {from: f, to: t, power: 0};
	        var d = (t - f) / steps, r = ~~(d), R = r, i = 0;
	        if (r) { while (R) { i--; R = ~~(d * Math.pow(10, i)) / Math.pow(10, i); } i++; } 
	        else {
	            if (d == 0 || !isFinite(d)) { i = 1; } 
	            else { while (!r) { i = i || 1; r = ~~(d * Math.pow(10, i)) / Math.pow(10, i); i++; } }
	            i && i--;
	        }
	        t = round(to * Math.pow(10, i)) / Math.pow(10, i);
	        if (t < to) { t = round((to + .5) * Math.pow(10, i)) / Math.pow(10, i); }
	        f = round((from - (i > 0 ? 0 : .5)) * Math.pow(10, i)) / Math.pow(10, i);

	        return { from: f, to: t, power: i };
		}

		var paper = rData.rObj, chart = lineGraph,
			valuesx = xAxis, valuesy = yAxis,
			x = that.xPos - that.gBdr/2, y = that.yPos - that.gBdr/2,
			width = that.gWd + that.gBdr, height = that.gHt + that.gBdr, gutter = that.gBdr,
			allx = Array.prototype.concat.apply([], valuesx), ally = Array.prototype.concat.apply([], valuesy),
            xdim = snapEnds(Math.min.apply(Math, allx), Math.max.apply(Math, allx), valuesx[0].length - 1),
            minx = xdim.from, maxx = xdim.to,
            ydim = snapEnds(Math.min.apply(Math, ally), Math.max.apply(Math, ally), valuesy[0].length - 1),
            miny = ydim.from, maxy = ydim.to,
            kx = (width - gutter * 2) / ((maxx - minx) || 1), ky = (height - gutter * 2) / ((maxy - miny) || 1);

		if (Object.prototype.toString.call(valuesx) !== '[object Array]') valuesx = [valuesx];
		if (Object.prototype.toString.call(valuesy) !== '[object Array]') valuesy = [valuesy];

        var Xs = [];
        for (var i = 0, ii = valuesx.length; i < ii; i++) { Xs = Xs.concat(valuesx[i]) }
        Xs.sort(function(a,b) { return a - b; });
        var Xs2 = [], xs = [];
        for (i = 0, ii = Xs.length; i < ii; i++) { Xs[i] != Xs[i - 1] && Xs2.push(Xs[i]) && xs.push(x + gutter + (Xs[i] - minx) * kx); }
		Xs = Xs2; ii = Xs.length;

        var cvrs = paper.set();
        for (i = 0; i < ii; i++) {
            var X = xs[i] - (xs[i] - (xs[i - 1] || x)) / 2, w = ((xs[i + 1] || x + width) - xs[i]) / 2 + (xs[i] - (xs[i - 1] || x)) / 2, C;
            cvrs.push(C = paper.rect(X - 1, y, Math.max(w + 1, 1), height).attr({ stroke: "none", fill: "#000", opacity: 0 }));
            C.values = []; C.symbols = paper.set(); C.y = []; C.x = xs[i]; C.axis = Xs[i];
            for (var j = 0, jj = valuesy.length; j < jj; j++) {
                Xs2 = valuesx[j] || valuesx[0];
                for (var k = 0, kk = Xs2.length; k < kk; k++) {
                    if (Xs2[k] == Xs[i]) { C.values.push(valuesy[j][k]); C.y.push(y + height - gutter - (valuesy[j][k] - miny) * ky); C.symbols.push(chart.symbols[j][k]); }
                }
            }
        }

        that.hCols = cvrs;
	}

	// Internal function to create red cross graph hide button
	function createHideButton (gObj) {
		var btnDiv = document.createElement("div"),
			btnItm = document.createElement("button"),
			btnLoc = Object.prototype.toString.call(rData.dDiv) === '[object String]' ? document.getElementById(rData.dDiv) : rData.dDiv;
		btnItm.className = "btn btn-danger btn-xs";
		btnItm.innerHTML = '<span class="glyphicon glyphicon-chevron-up" style="color:#000000;"></span>';
		btnDiv.appendChild(btnItm);
		btnDiv.setAttribute("style", "position: absolute; top:" + ( gObj.yPos - 32.5 ) + "px; left:" + (gObj.gWd + gObj.xPos - 32.5) + "px;");
		btnLoc.appendChild(btnDiv);

		$(btnItm).click(function () {
			if (gObj.gHid) {
				gObj.gHid = false;
				gObj.show();
				this.innerHTML = '<span class="glyphicon glyphicon-chevron-up" style="color:#000000;"></span>';
				$(this).attr("class", "btn btn-danger btn-xs");
				rData.unshiftGraph(gObj.gMAC);
			} else {
				gObj.gHid = true;
				gObj.hide();
				this.innerHTML = '<span class="glyphicon glyphicon-chevron-down" style="color:#000000;"></span>';
				$(this).attr("class", "btn btn-success btn-xs");
				rData.shiftGraph(gObj.gMAC);
			}
		});

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
					var tagRot = this.axis > gObj.gCol / 2 ? 180 : 0,
						gMatrix = gObj.gObj[0][0].matrix.split();
					var tag = rData.rObj.tag(this.x + gMatrix.dx, this.y[0] + gMatrix.dy, newTagString, tagRot, 6).attr([{ fill: '#000', stroke: '#eee', 'stroke-width': 2, 'fill-opacity': .75 }, { fill: '#eee', 'fill-opacity': .8 }]);
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

		!gObj.hCols && createColumns();
		gObj.hoverColumn(mouseOn, mouseOff);
	}

	if (!this.gUpd) {
		this.gMAC = yData.mac;
		this.gWd  = gWidth === undefined || !gWidth ? (rData.pWd * 0.85 < 24*this.gCol ? 24*this.gCol : rData.pWd * 0.85) : gWidth;
		this.gHt  = gHeight === undefined || !gHeight ? (rData.pHt * 0.25 < 12*this.gRow ? 12*this.gRow : rData.pHt * 0.25) : gHeight;
		
		this.createGraphTitles(rData);
		this.gGrid = rData.rObj.drawGrid(this.xPos + (this.gBdr / 2), this.yPos + (this.gBdr / 2), this.gWd - this.gBdr, this.gHt - this.gBdr, this.gCol, this.gRow);
		if (this.altD === undefined) this.gHideBtn = createHideButton(this);
	}

	var xAxisTemp = [], xAxis = [], yAxis = []; 
	for (var i = 0; i < this.gCol; i++) xAxisTemp[i] = i + 1;

	var gShd, that = this;
	if (this.altD) {
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
		if (xAxisLabels.length) {
			for (var i = 1; i < xAxisLabels.length; i++) { if (i - 1 < xLabel.length) { xAxisLabels[i].attr({'text': xLabel[i - 1].time, transform: "T -15 10"}); xAxisLabels[i].rotate(-40); } else { xAxisLabels[i].attr({'text': ""}); } }
			xAxisLabels[0].attr({'text': ""});
		}		
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
		bSts = aState === undefined ? true : aState;

	bDiv.className = "switch";
	bDiv.style.position = "absolute"; bDiv.style.marginLeft = "-" + this.gWd + "px";
	$(bDiv).data({'on-label': "Line", 'off-label': "Bar", 'on': "success", 'off': "warning"});

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
 * ONOD Graph Class Update Graph Data Function
 **/
Graph.prototype.update = function (rData, newData, xLabel) {
	xLabel = xLabel === undefined ? newData.time : xLabel;
	if (Object.prototype.toString.call(newData.data) === '[object Object]') {
		for (var j in newData.data) {
			if (Object.prototype.toString.call(newData.data[j]) === '[object Array]' && this.gCol != newData.data[j].length) {
				this.gCol = newData.data[j].length
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

	var gMatrix = this.gObj[0][0].matrix.split();
	this.xPos += gMatrix.dx; this.yPos += gMatrix.dy;
	this.remove();
	this.create(rData, newData, xLabel, this.gHvrTagCfgStr);
	
	this.gUpd = false;
};

/**
 * ONOD Graph Class Bar Graph Update Function
 **/
Graph.prototype.barUpdate = function (newData, index) {
	var cData;
	if (index === undefined) {
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

Graph.prototype.processColor = function (gColor) {
	gColor = gColor === undefined || !gColor ? '#'+('00000'+(Math.random()*(1<<24)|0).toString(16)).slice(-6) : gColor;
	this.gColor = Object.prototype.toString.call(gColor) === '[object Array]' ? gColor : [gColor];
	for (var i = 0; i < this.gColor.length; i++) if (this.gColor[i] === undefined || !this.gColor[i]) this.gColor[i] = '#'+('00000'+(Math.random()*(1<<24)|0).toString(16)).slice(-6);
	this.gColor.push('transparent');
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
					that.gTtlObjs.push(rData.rObj.text(that.xPos + (that.gWd / 2), that.yPos - 22.5 * tSca, item).attr({'fill': '#DB9121','font-family': 'Arial, Sans-Serif', 'font-size': 16, 'font-weight': 'bold'}));
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

Graph.prototype.hoverColumn = function (fin, fout) {
	this.hCols && this.hCols.mouseover(fin).mouseout(fout);
};

Graph.prototype.unhoverColumn = function () {
	if (this.hCols) {
		this.hCols.unmouseover().mouseout();
		this.hCols.remove();
		this.hCols.clear();
		this.hCols = null;
	}
};

/**
 * ONOD Graph Class Hide Graph Function
 **/
Graph.prototype.hide = function () {
	this.gGrid && this.gGrid.hide();
	this.hCols && this.hCols.hide();
	this.gObj.hide();
	for (var i = 0; i < this.gObj.axis.length; i++) 
		this.gObj.axis[i].text.hide();
	if (this.gTtl.tSet && this.gTtlObjs)
		for (var i = 1; i < this.gTtlObjs.length; i++) {
			this.gTtlObjs[i].hide();
		}
};

/**
 * ONOD Graph Class Show Graph Function
 **/
Graph.prototype.show = function () {
	this.gGrid && this.gGrid.show();
	this.hCols && this.hCols.show();
	this.gObj.show();
	for (var i = 0; i < this.gObj.axis.length; i++) 
		this.gObj.axis[i].text.show();
	if (this.gTtl.tSet && this.gTtlObjs)
		for (var i = 1; i < this.gTtlObjs.length; i++) {
			this.gTtlObjs[i].show();
		}
};

/**
 * ONOD Graph Class Remove Graph Function
 **/
Graph.prototype.remove = function () {
	this.tags && this.tags.remove();
	this.bTxt && this.bTxt.remove();
	this.gObj.unhover && this.gObj.unhover();
	this.unhoverColumn(); 
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

Graph.prototype.moveGraph = function (xDist, yDist) {
	if (!xDist && !yDist) return;
	var rTrStr = "...T" + xDist + "," + yDist;
	this.tags && this.tags.transform(rTrStr);
	this.gGrid && this.gGrid.transform(rTrStr);
	this.hCols && this.hCols.transform(rTrStr);
	this.gObj.transform(rTrStr);

	if (this.gHideBtn) {
		var oldBtnPosX = parseInt($(this.gHideBtn).css('left'), 10), oldBtnPosY = parseInt($(this.gHideBtn).css('top'), 10);
		if (xDist) $(this.gHideBtn).css('left', "" + (oldBtnPosX + xDist) + "px");
		if (yDist) $(this.gHideBtn).css( 'top', "" + (oldBtnPosY + yDist) + "px");
	}

	if (this.gTtl.tSet && this.gTtlObjs)
		for (var i = 0; i < this.gTtlObjs.length; i++) {
			this.gTtlObjs[i].transform(rTrStr);
		}

	for (var i = 0; i < this.gObj.axis.length; i++) 
		this.gObj.axis[i].text.transform(rTrStr);
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
	this.cMgX  = cMgX === undefined || !cMgX ? 237 : cMgX;
	this.cMgY  = cMgY === undefined || !cMgY ? 96 : cMgY;
	this.pWd  = cWd === undefined || !cWd ? $(window).width() - this.cMgX : cWd;
	this.pHt  = cHt === undefined || !cHt ? $(window).height() - this.cMgY : cHt;
	this.rObj = Raphael(this.dDiv, this.pWd, this.pHt);
	this.rObj.renderfix();
	this.gObj = [];
	this.cObj = [];
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
	$(this.rObj.canvas).parent().parent().height(this.pHt);
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

 Canvas.prototype.shiftGraph = function (mac) {
 	var yTransform = 0, tList = [];

 	for (var i = 0; i < this.gObj.length; i++) {
 		if (this.gObj[i].gHid && !this.gObj[i].gTrf) {
 			yTransform += this.gObj[i].gHt * 1.5;
 			this.gObj[i].gTrf = true;
 			tList.push(i+1);
 		}
 	}

 	for (var i = 0; i < tList.length; i++) {
 		for (var j = tList[i]; j < this.gObj.length; j++) {
 			this.gObj[j].moveGraph(0, -yTransform);
 		}
 	}

 	this.setDim($(this.rObj.canvas).outerHeight() - yTransform, $(this.rObj.canvas).outerWidth());
 };

 Canvas.prototype.unshiftGraph = function (mac) {
 	var yTransform = 0, tList = [];

 	for (var i = 0; i < this.gObj.length; i++) {
 		if (!this.gObj[i].gHid && this.gObj[i].gTrf) {
 			yTransform += this.gObj[i].gHt * 1.5;
 			this.gObj[i].gTrf = false;
 			tList.push(i+1);
 		}
 	}

 	for (var i = 0; i < tList.length; i++) {
 		for (var j = tList[i]; j < this.gObj.length; j++) {
 			this.gObj[j].moveGraph(0, yTransform);
 		}
 	}

 	this.setDim($(this.rObj.canvas).outerHeight() + yTransform, $(this.rObj.canvas).outerWidth());
 };

/**
 * ONOD Canvas Class Hide Canvas Function
 * This function will use jQuery to hide this canvas if visible.
 **/
Canvas.prototype.hide = function () {
	if ($(this.rObj.canvas).is(":visible") || this.rObj.canvas.style.display != "none") {
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


function oAnnounce (oDisp) {
	this.mDisp = oDisp;
	this.tID = -1;
};

oAnnounce.prototype.createNewButton = function(hname, addr, id) {
	var btnLabel = document.createElement("label"),
		btnLoc = document.getElementById("AnnBtn-group"),
		self = this;

	btnLabel.className = "btn btn-primary AnnBtn";
	btnLabel.innerHTML = '<input type="radio" name="options" id="AnnBtn-' + id +'" value="'+ addr + '" >' + hname + ': ' + addr;
	create_tooltip(btnLabel, "Warning: This will redirect your page.", "right");
	btnLoc.appendChild(btnLabel);
	$(btnLabel).click(function () {
		function setHost (disp, hname) {
			if (disp.updateHost(hname))
				return 
			else setTimeout(function () {
				setHost(disp, hname);
			}, 500);
		}

		//setHost(self.mDisp, addr);

		window.location = "http://"+ addr + "/cgi-bin/vt_status.html";
		$(this).addClass('active');
	});

	return btnLabel;
};

oAnnounce.prototype.updateGroup = function(newData, d) {
	$("#AnnBtn-group").empty();

	var i = 0, self = this;
	$.each(newData.hosts, function(key) {
		self.createNewButton(this.hostname, this.ipaddr, i++);
	});
	d.resolve();

	var hostname = window.location.hostname;
	$("input[value*='" + hostname + "']").closest('label').addClass('active');
};

function create_tooltip(location, content, direction)
{
	direction = typeof direction !== 'undefined' ? direction : "top";
	$(location).tooltip({"title": content, "container": "body", "placement": direction, "trigger": "hover"});
}

function create_popover(location, content, direction)
{
	direction = typeof direction !== 'undefined' ? direction : "top";
	$(location).popover({"content": content, "container": "body", "placement": direction, "trigger": "hover"});
}

function help_tips()
{
	create_tooltip("#config", "Logger Configuration", "left");
	create_tooltip("#rTime", "How many times to scan.", "right");
	create_tooltip("#sInterv", "How often to scan in seconds.\n(Recommended is 5 seconds.)", "right");
	create_tooltip("#lLen", "How many entries in each log file.", "right");
	create_tooltip("label[for='checkboxes-settings-cL']", "Ticking this will clear all previous logs.", "right");
	create_tooltip("label[for='checkboxes-settings-rF']", "Logger will run until stopped.", "right");
	create_tooltip("label[for='checkboxes-dataType-0']", "Will collect information for:\nNode Neighborhood\nNode Batman Score", "right");
	create_tooltip("label[for='checkboxes-dataType-1']", "Will collect information for:\nNode Neighborhood\nNode Wireless S.N.R\nNode Wireless RSSI", "right");
	create_tooltip("label[for='checkboxes-dataType-2']", "Will collect information for:\nNode Wireless Scan", "right");
	create_tooltip("#closesettings", "Close without saving the settings.");
	create_tooltip("#savesettings", "Will save the settings and use them the next time the logger is started.");
	create_tooltip("#saveapplysettings", "Will save the settings and start/restart the logger.");
	create_tooltip("#cogMenu [value='1']", "Start logger with the following settings:\nScan interval: 5\nRun time: Infinite\nLog length: 25\nTypes: Batman, Associate, Wi-Fi\nReset logs: False", "left");
	create_tooltip("#cogMenu [value='3']", "Warning: This delete all logs.", "left");
	create_tooltip("#cogMenu [value='4']", "Modifies logger settings on the router.", "left");
	
	//create_popover("#nodeneighborhood", "Dashboard view.", "right");
}

function create_alert (location, htmlContent) {
	function createCloseBtn (loc) {
		var btnCAlert = document.createElement("button");
		btnCAlert.className = "close";
		btnCAlert.setAttribute('type', 'button');
		btnCAlert.setAttribute('data-dismiss', 'alert');
		btnCAlert.setAttribute('aria-hidden', 'true');
		btnCAlert.innerHTML ='x';
		$(loc).prepend(btnCAlert);
	}

	var divAlert = document.createElement("div");
	var divAlertLoc = document.getElementById(location);
	divAlert.className = "alert alert-block alert-danger fade in";
	divAlert.id = "alert-" + $(divAlertLoc).children().length;
	divAlert.innerHTML = htmlContent;
	$(divAlertLoc).prepend(divAlert);
	createCloseBtn(divAlert);
}

function oInit () {
 	var oCanvas = new Canvas ();
	create_alert("oAlert", "<h4>Oh snap! You got an error!</h4>");
	
	$("#" + oCanvas.dDiv).scroll(oCanvas, function () {
		oCanvas.onScroll();
	});
	oCanvas.setDim(oCanvas.pHt - 5);
	oCanvas.hide();

	var oDash = new oGroup (oCanvas, 2, 0),
		oBat = new oGroup (oCanvas, 0, 1),
		oSNR = new oGroup (oCanvas, 0, 2),
		oWScan = new oGroup (oCanvas, 1, 3),
		oRSSI = new oGroup (oCanvas, 0, 4);

	/* Setup the hostname Dispatcher */
	var hRef = {
		0 : {url: "/log/bathosts_log.json", oGrp: null}
	}

	var logStorage = {},
		hDisp = new Dispatcher (hRef, new JSON(logStorage), 120000);

	/* Setup the Log dispatcher */
	var refList = {
		0 : {url: ["/log/batman_log.json", "/log/assoc_log.json"], oGrp: oDash},
		1 : {url: "/log/batman_log.json", oGrp: oBat},
		2 : {url: "/log/assoc_log.json", oGrp: oSNR},
		3 : {url: "/log/scan_log.json", oGrp: oWScan},
		4 : {url: "/log/assoc_log.json", oGrp: oRSSI}
	}	

	var eventData = {
		oDisp: new Dispatcher (refList, new JSON(logStorage), 5000),
		oLua: new Lua ()
	}

	/* Setup the Announcer dispatcher */
	var oAnn = new oAnnounce(eventData.oDisp);
	var anRef = {
		0 : {url: "/log/announce_log.json", oGrp: oAnn}
	}

	var aDisp = new Dispatcher (anRef, new JSON(logStorage), 120000);
	

	var rData = {oCanvas: oCanvas, oDisp: eventData.oDisp};
	$(window).resize(rData, function () {
		clearTimeout(rData.oCanvas.cRsz);
		rData.oCanvas.cRsz = setTimeout(function () {
			rData.oCanvas.updateDim();
			rData.oCanvas.setDim();
			if ($(rData.oCanvas.rObj.canvas).width() > 640)
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
		if (!self.uiBlockFlg) {
			if (eventData.oDisp.setActive(this.value) != null) {
				$(this.parentElement.children).each(function() { 
					if ($(this).hasClass('active')) {
						$(this).removeClass('active');	
					}
				});
				$(this).addClass('active');
			}
		}
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
		if (this.value == "runForever") {
			if ($(this).is(':checked')) 
				$('#rTime').prop('disabled', true);
			else
				$('#rTime').prop('disabled', false);
		}
	});

	$("input[name*='checkboxes-dataType']").click(eventData, function () {
		var i = 0;
		$("input[name*='checkboxes-dataType']").each(function(index, Element) {
			if ($(this).is(':checked'))
				i++;
		});

		if (i > 0)
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
				if ($(this).is(':checked'))
					formObj.dataTypes.push(this.value); 
			});

			if (formObj.dataTypes.length === 0) {
				formObj.dataTypes = null;
			}
		
			console.log(formObj)
			return formObj;
		}

		formObj = processForm(this);
		eventData.oLua.updateLogSet(formObj.sInterv, formObj.rTime, formObj.lLen, formObj.dataTypes, formObj.resetLog);
		return false;
	});

	help_tips();

	return eventData.oDisp;
}

$(document).ready(function() {
	oInit ();
});