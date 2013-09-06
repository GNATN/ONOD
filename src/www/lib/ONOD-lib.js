/**
 * ONOD Lua Interface Class
 * Constructor Parameters:
 *		-> sleepTime = Interval in seconds between data re-poll (server-side) (Default: 5 seconds)
 *		-> runTime = Length of time to run logger job for (Default: 0 - infinite run)
 *		-> maxLn = Maximum lines of data entries to keep in JSON file. Should match with defined graph columns.
 **/
function Lua (sleepTime, runTime, maxLn) {
	this.sleepTime = sleepTime === undefined ? 5 : sleepTime;
	this.runTime = runTime === undefined ? 0 : runTime;
	this.maxLn = maxLn === undefined ? 25 : maxLn;
}

Lua.prototype.start = function (reset) {
	reset = reset === undefined ? 0 : reset;
	xhr = new XMLHttpRequest();
	xhr.open("GET", "/lua/?action=start&sleep_time=" + this.sleepTime + "&run_time=" + this.runTime + "&max_lines=" + this.maxLn + "&reset_file=" + reset);
	xhr.send();
};

Lua.prototype.stop = function () {
	var xhr = new XMLHttpRequest();
	xhr.open("GET", "/lua/?action=stop");
	xhr.send();
};

Lua.prototype.restart = function () {
	this.stop();
	this.start(1);
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
	this.aRef = {tID: 0, ref: this.refList[0]};
	this.blockFlg = false;
	this.rClass.fetchNewData(this, this.aRef, true);
	this.interv = this.intervalUpdate(this.mSecs, this.aRef);
}

/**
 * ONOD Dispatcher Class Start Interval Callback  Function
 * Parameters:
 *		-> retrivClass = Pointer to a class that fetches data from the server
 *		-> ref = ref includes an ID and a URL of where to find the log File. 
 *		-> mSecs = Interval in seconds between data re-poll (Client-side) (Default: 5 seconds)
 **/
Dispatcher.prototype.intervalUpdate = function (mSecs, ref) {
	this.stopInterv();
	var self = this;
	return setInterval(function(){self.rClass.fetchNewData(self, ref)}, mSecs);
};

/**
 * ONOD Dispatcher Class Update Timeout Function
 * Parameters: 
 *		-> mSecs = Interval in seconds between data re-poll (Client-side) (Default: 5 seconds)
 **/
Dispatcher.prototype.updateTimeout = function(mSecs) {
	this.mSecs = mSecs === undefined ? 5000 : mSecs;
	this.interv = this.intervalUpdate(this.mSecs, this.aRef, this.rClass);
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
	this.aRef.ref.oGrp.removeGroup();
	this.aRef = {tID: id, ref: this.refList[id]};
	this.rClass.fetchNewData(this, this.aRef, true);
	this.interv = this.intervalUpdate(this.mSecs, this.aRef, this.rClass);
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


/**
 * ONOD JSON Interface Class
 **/
function JSON () {
	this.prevLogs = [];
}

/**
 * ONOD JSON Class Start Interval Callback Function
 * Parameters:
 *		-> ref = ref includes an ID and a URL of where to find the log File. 
 *		-> fUpd = Flag that when set to true will force a redraw and poll of that tabs information (if not set, defaults to false) 
 */
JSON.prototype.fetchNewData = function (oDisp, aRef, fUpd) {
	var self = this;
	oDisp.disBlock();
	if (fUpd === undefined) fUpd = false;
	
	$.ajax({
		url: aRef.ref.url,
		type: 'GET',
		dataType: 'json',
		ifModified:true,
		success: function (data, status, jqXHR) {
			if(jqXHR.statusText == "OK") {
				self.updateLog(aRef.ref.id, data);
				aRef.ref.oGrp.updateGroup(self.processJSON(aRef.tID, data));
			} else if(jqXHR.statusText == "Not Modified" && fUpd) {
				aRef.ref.oGrp.updateGroup(self.processJSON(self.getLog(aRef.ref.id)));
			}
			oDisp.disUnblock();
		}, 
		beforeSend: setHeader
	});

	function setHeader(xhr) {
		xhr.setRequestHeader("If-Modified-Since");
    }
}

JSON.prototype.getLog = function(id) {
	return this.prevLogs[id];
};

JSON.prototype.updateLog = function (id, data) {
	function findById(source, id) {
		for (var i = 0; i < source.length; i++) {
			if (source[i].id === id) {
				return i;
			}
		}
		return null;
	}

	var index = findById(this.prevLogs, id);
	if (index == null) this.prevLogs.push({id: id, data: data});
	else this.prevLogs[index].data = data;
};

JSON.prototype.processJSON = function (jID, jData) {
	function bScoreConvert (log) {
		var dataSeries = [];
		
		$.each(log.items, function(key, item) {
			var date = item.time.split(/(?:\s+)/g);
			var time = {day: date[0], month: date[1], date: date[2], time: date[3], year: date[4]};
			
			$.each(item.originNodes, function(key, item) { 
				var flag = false, mac = item[0];
				
				for(i = 0; i < dataSeries.length; i++)
					if(mac == dataSeries[i].mac) {
						flag = true;
						dataSeries[i].time.push(time);
						dataSeries[i].ls.push(item[1]);
						dataSeries[i].data.push(item[2]);
					}
					
				if(!flag) {
					dataSeries.push({time: [time], mac: item[0], ls: [item[1]], data: [item[2]]});
				}
			});
		});
		
		return dataSeries;
	}

	function aListConvert (log) {
		var dataSeries = [];
		
		$.each(log.items, function(key, item) {
			var date = item.time.split(/(?:\s+)/g);
			var time = {day: date[0], month: date[1], date: date[2], time: date[3], year: date[4]};
			
			$.each(item.aList, function(key, item) {
				var flag = false;
							 	
				for(i = 0; i < dataSeries.length; i++)
					if(key == dataSeries[i].mac) {
						flag = true;
						dataSeries[i].time.push(time);
						dataSeries[i].noise.push(item.noise);
						dataSeries[i].signal.push(item.signal);
						dataSeries[i].txR.push(item.tx_rate);
						dataSeries[i].txP.push(item.tx_packets);
						dataSeries[i].rxR.push(item.rx_rate);
						dataSeries[i].rxP.push(item.rx_packets);
					}
				
				if(!flag) {
					dataSeries.push({time: [time], mac: key, noise: [item.noise], signal: [item.signal], txR: [item.tx_rate], txP: [item.tx_packets], rxR: [item.rx_rate], rxP: [item.rx_packets]});
				}
			});
		});
		
		return dataSeries;
	}

	var newData;
	switch (jID) {
		case 0:
			newData = bScoreConvert(jData);
			break;

		case 1:
			newData = aListConvert(jData);
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
				if (self.cObj.gObj[i]) {
					self.cObj.gObj[i].update(self.cObj, newData[i]);
				} else {
					var gColors = ['#3f72bf', '#50e7f7', '#11f4c8'],
						gHvrTagCfgStr = 'timestamp br L="Batman Quality Score" D=0 br P="ls" L="Node Last Seen (s)"';
					
					var	gObj = new Graph (50, 50 + (self.gSpa * i), 13, 25, 260, gColors[i]);
					
					gObj.setTitles("Node (" + newData[i].mac + ")", "Time (HH-MM-SS)", "Score (0 - 255)");
					gObj.create(self.cObj, newData[i], newData[i].time, gHvrTagCfgStr);
					self.cObj.gObj.push(gObj);
				}
				self.cObj.setDim(self.gSpa * newData.length);
			break;
			
			case 1:
				var gDataSig = {mac: newData[i].mac, data: newData[i].signal},
					gDataNoi = {mac: newData[i].mac, data: newData[i].noise};
				
				if (self.cObj.gObj[i]) {
					self.cObj.gObj[i].update(self.cObj, [gDataSig, gDataNoi], newData[i].time);
				} else {
					var gColors = ['#3f72bf', '#50e7f7', '#11f4c8'],
						gHvrTagCfgStr = 'timestamp br L="Signal" D=0 br L="Noise" D=1';
					
					var	gObj = new Graph (50, 50 + (self.gSpa * i), 13, 25, -100, gColors[i]);
					
					gObj.setTitles("Node (" + newData[i].mac + ")", "Time (HH-MM-SS)", "dB (-100 - 0)");
					gObj.create(self.cObj, [gDataSig, gDataNoi], newData[i].time, gHvrTagCfgStr);
					self.cObj.gObj.push(gObj);
				}
				self.cObj.setDim(self.gSpa * newData.length);
			break;
		}

		if (++i < newData.length) {
			setTimeout(processGraph, 0);
		}
	}

	if (newData != null && newData.length) { 
		var self = this, i = 0;
		setTimeout(processGraph, 0);
	}
/*
	switch (tID) {
	case 0:
		if (this.cObj.gObj.length) {
			for (var i = 0; i < this.cObj.gObj.length; i++)
				this.cObj.gObj[i].update(this.cObj, newData[i]);
		} else {
			for (var i in newData) {
				var gColors = ['#3f72bf', '#50e7f7', '#11f4c8'],
					gHvrTagCfgStr = 'timestamp br L="Batman Quality Score" D=0 br P="ls" L="Node Last Seen (s)"';
				
				var	gObj = new Graph (50, 50 + ((this.cObj.pHt * 0.5) * i), 13, 25, 260, gColors[i]);
				
				gObj.setTitles("Node (" + newData[i].mac + ")", "Time (HH-MM-SS)", "Score (0 - 255)");
				gObj.create(this.cObj, newData[i], newData[i].time, gHvrTagCfgStr);
				this.cObj.gObj.push(gObj);
				this.gID = newData.tabID;	
				this.gSpa = this.cObj.pHt * 0.5;	
			}
			this.cObj.setDim((this.cObj.pHt * 0.5) * newData.length);
		} 
	break;
	
	case 1:
		var gDataSig = [],
			gDataNoi = [];
			
		if (this.cObj.gObj[i]) {
			for (var i = 0; i < this.cObj.gObj.length; i++) {
				gDataSig[i] = {mac: newData[i].mac, data: newData[i].signal};
				gDataNoi[i] = {mac: newData[i].mac, data: newData[i].noise};
				this.cObj.gObj[i].update(this.cObj, [gDataSig[i], gDataNoi[i]], newData[i].time);
			}
		} else {
			for (var i in newData) {
				gDataSig[i] = {mac: newData[i].mac, data: newData[i].signal};
				gDataNoi[i] = {mac: newData[i].mac, data: newData[i].noise};
				var gColors = ['#3f72bf', '#50e7f7', '#11f4c8'],
				gHvrTagCfgStr = 'timestamp br L="Signal" D=0 br L="Noise" D=1';
				
				var	gObj = new Graph (50, 50 + ((this.cObj.pHt * 0.5) * i), 13, 25, -100, gColors[i]);
			
				gObj.setTitles("Node (" + newData[i].mac + ")", "Time (HH-MM-SS)", "dB (-100 - 0)");
				gObj.create(this.cObj, [gDataSig[i], gDataNoi[i]], newData[i].time, gHvrTagCfgStr);
				this.cObj.gObj.push(gObj);	
				this.tID = newData.tabID;
				this.gSpa = this.cObj.pHt * 0.5;
			}
			this.cObj.setDim(this.gSpa * newData.length);
		}
	break;
	};*/
};

oGroup.prototype.removeGroup = function () {
	switch (this.tID) {
		case 0:
		case 1:
			for (var i = 0; i < this.cObj.gObj.length; i++)
				this.cObj.gObj[i].remove();
			this.cObj.gObj.length = 0;
			if (this.cObj.gVis) this.cObj.gVis.length = 0;
			$("#" + this.cObj.dDiv)[0].scrollTop = 0;
		break;
	}
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
			btnItm = document.createElement("a"),
			btnLoc = document.getElementById(rData.dDiv);
		btnDiv.className = "btn-group";
		btnItm.className = "btn btn-danger";
		btnItm.href = "#"
		btnItm.innerHTML = '<i class="icon-remove"></i>';
		btnDiv.appendChild(btnItm);
		btnDiv.setAttribute("style", "position: absolute; top:" + ( gObj.yPos - 35 ) + "px; left:" + (gObj.gWd) + "px;");
		btnLoc.appendChild(btnDiv);
		return btnDiv;
	}

	// Internal function to create defined graph main and axis titles
	function createGraphTitles (gObj) {
		if (gObj.gTtl.tSet) {
			gObj.gTtlObjs = [];
			$.each(gObj.gTtl, function (key, item) {
				switch (key) {
					case "mT":
						gObj.gTtlObjs.push(rData.rObj.text(gObj.xPos + (gObj.gWd / 2), gObj.yPos - 22.5, item).attr({'font-family': 'Arial, Sans-Serif', 'font-size': 16, 'font-weight': 'bold'}));
						break;
					case "xT":
						gObj.gTtlObjs.push(rData.rObj.text(gObj.xPos + (gObj.gWd / 2), gObj.yPos + gObj.gHt + 50, item).attr({'font-family': 'Arial, Sans-Serif', 'font-size': 16, 'font-weight': 'bold'}));
						break;
					case "yT":
						gObj.gTtlObjs.push(rData.rObj.text(gObj.xPos - 30, gObj.yPos + (gObj.gHt / 2), item).attr({'font-family': 'Arial, Sans-Serif', 'font-size': 16, 'font-weight': 'bold'}));
						gObj.gTtlObjs[gObj.gTtlObjs.length - 1].rotate(-90);
						break;
				}
			});
		}
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
									tCpy = tRes[0].replace('"'+tPrp+'"', "");
									var	tLbl = tCpy.match(/"([^"]*)"/).slice(1)[0];

									var tDta;
									$.each(yData[0], function (key) {
										if (tPrp == key) tDta = this[tIndex];
									});

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
		this.gWd  = gWidth === undefined ? rData.pWd * 0.9 : gWidth;
		this.gHt  = gHeight === undefined ? rData.pHt * 0.25 : gHeight;
		
		createGraphTitles(this);
		this.gGrid = rData.rObj.drawGrid(this.xPos + (this.gBdr / 2), this.yPos + (this.gBdr / 2), this.gWd - this.gBdr, this.gHt - this.gBdr, this.gCol, this.gRow);
		this.gHideBtn = createHideButton(this);
	}

	var xAxisTemp = [], xAxis = [], yAxis = []; 
	for (var i = 0; i < this.gCol; i++) xAxisTemp[i] = i + 1;
	yData = Object.prototype.toString.call(yData) === '[object Array]' ? yData : [yData];
	for (var i in yData) { yAxis[i] = yData[i].data; xAxis.push(xAxisTemp); }
	xAxis.push([0, this.gCol]); yAxis.push([0, this.gMax]);

	var gShd;
	if (yAxis.length > 2) {
		gShd = false;
		if (this.gColor.length < yAxis.length) {
			this.gColor.pop();
			for (var i = 0; i < yAxis.length - 2; i++) this.gColor.push('#'+(Math.random() * 0xFFFFFF << 0).toString(16));
			this.gColor.push('transparent');
		}
	} else {
		gShd = true;
	}

	var lineGraph = rData.rObj.linechart(this.xPos, this.yPos, this.gWd, this.gHt, xAxis, yAxis, 
	{ 
		shade: gShd, 
		colors: this.gColor, 
		symbol: 'circle', 
		axis: '0 0 1 1', 
		width: 4, 
		axisxstep: this.gCol, 
		axisystep: this.gRow 
	});

	for (var i in yData) lineGraph.symbols[i].attr({r: 4, stroke: this.gColor[i], fill: '#333', "stroke-width": 2});

	if (hTagStr !== undefined && Object.prototype.toString.call(hTagStr) === '[object String]') {
		setHoverTag(this, hTagStr);
		this.hTagStr = hTagStr;
	} else if (this.hTagStr !== undefined) {
		setHoverTag(this, this.hTagStr);
	}

	if (xLabel !== undefined && Object.prototype.toString.call(xLabel) === '[object Array]') {
		var xAxisLabels = lineGraph.axis[0].text.items;
		for (var i = 1; i < xAxisLabels.length; i++) { if (i - 1 < xLabel.length) { xAxisLabels[i].attr({'text' : xLabel[i - 1].time, transform: "T -15 10"}); xAxisLabels[i].rotate(-40); } else { xAxisLabels[i].attr({'text' : ""}); } }
		xAxisLabels[0].attr({'text' : ""});
	}

	this.gObj = lineGraph;
};

/**
 * ONOD Graph Class Set Graph Title Function
 * Parameters:
 *		-> gTitle = Main title to be displayed top center of the graph
 * 		-> xTitle = x-Axis title to be displayed bottom center of the graph
 * 		-> yTitle = y-Axis title to be displayed vertically left of the graph
 **/
Graph.prototype.setTitles = function (gTitle, xTitle, yTitle) {
	if (gTitle !== undefined && gTitle != null) { this.gTtl.mT = gTitle; if(!this.gTtl.tSet) this.gTtl.tSet = true; }
	if (xTitle !== undefined && xTitle != null) { this.gTtl.xT = xTitle; if(!this.gTtl.tSet) this.gTtl.tSet = true; }
	if (yTitle !== undefined && yTitle != null) { this.gTtl.yT = yTitle; if(!this.gTtl.tSet) this.gTtl.tSet = true; }
};

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
	this.gObj.unhoverColumn(); 
	this.gObj.remove(); 
	this.gObj.clear();
	
	if (!this.gUpd) {
		if (this.gTtl.tSet)
			for (var i = 0; i < this.gTtlObjs.length; i++) {
				this.gTtlObjs[i].remove();
			}				
		$(this.gHideBtn).remove();
		this.gGrid.remove();
	}
};

/**
 * ONOD Graph Class Update Graph Data Function
 **/
Graph.prototype.update = function (rData, newData, xLabel) {
	xLabel = xLabel === undefined ? newData.time : xLabel;
	this.gUpd = true;
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
 **/
function Canvas (destDiv, cWd, cHt, cMgX, cMgY) {
	cWd  = cWd === undefined ? '100%' : cWd;
	cHt  = cHt === undefined ? '100%' : cHt;
	this.dDiv = destDiv === undefined ? 'oPlace' : destDiv;
	this.cMgX  = cMgX === undefined ? 220 : cMgX;
	this.cMgY  = cMgY === undefined ? 91 : cMgY;
	this.rObj = Raphael(this.dDiv, cWd, cHt);
	this.pWd  = $(this.rObj.canvas).parent().width();
	this.pHt  = $(this.rObj.canvas).parent().height() - this.cMgY;
	this.gObj = [];

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
	cWidth = cWidth === undefined ? $(this.rObj.canvas).outerWidth() : cWidth;
	this.rObj.setSize(cWidth, cHeight);
	$(this.rObj.canvas).parent().height(this.pHt);
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

/**
 * ONOD Canvas Class Hide Canvas Function
 * This function will use jQuery to hide this canvas if visible.
 **/
Canvas.prototype.hide = function () {
	if ($(this.rObj.canvas).is(":visible") ) {
		$('#' + this.dDiv)[0].scrollIntoView(true);
		$(this.rObj.canvas).parent().css("overflow", "hidden");
		$(this.rObj.canvas).hide();
		$("#oHolder").show();	// Optional - Show replacement div
	}
};


function oInit (cObj) {
	
	var oBat = new oGroup(cObj, 0, 0);
	var oSNR = new oGroup(cObj, 0, 1);
	var oWScan = new oGroup(cObj.dDiv, 1, 2);
	var oRSSI = new oGroup(cObj, 0, 3);
	
	var refList = {
		0 : {id: 0, url: "/log/batman_log.json", oGrp: oBat},
		1 : {id: 1, url: "/log/assoc_log.json", oGrp: oSNR},
		2 : {id: 2, url: "/log/scan_log.json", oGrp: oWScan},
		3 : {id: 2, url: "/log/scan_log.json", oGrp: oRSSI}
	}	

	var oDisp = new Dispatcher(refList);

	$("#side li").click(oDisp, function () {
		if(oDisp.blockFlg == true) return;
		$(this.parentElement.children).each(function() { 
			if ($(this).hasClass('active')) {
				$(this).removeClass('active');
			}
		});

		$(this).addClass('active');
		oDisp.setActive(this.value);
	});

	var oLua = new Lua ();

	$("#menu > ul > li > ul > li").click(oLua, function () { 
		switch (Number(this.value)) {
			case 1:
				oLua.start();
				break;
			case 2:
				oLua.stop();
				break;
			case 3:
				break;
			case 4:
				oLua.restart();
				break;
		}		
	});

	return oDisp;
}


$(document).ready(function() {
/**
 * new Canvas ( destDiv = ID of HTML element to contain Raphael Canvas Object (without #),
 *				cWd  = Width of canvas in pixels or percent (Default: 100%),
 *				cHt  = Height of canvas in pixels or percent (Default: 100%),
 *				cMgX = Amount of horizontal margin space to remove due to navbar (Default: 220px),
 *				cMgY = Amount of vertical margin space to remove due to header/footer (Default: 91px) );
 **/
	var w =  $(window).width() - 220;
	$("#oPlace").css("width", w);
	var h = $(window).height();
	$("#oPlace").css("height", h);
	var oCanvas = new Canvas ('oPlace', w, h);
	var oDisp = oInit (oCanvas);

	$(window).resize(oCanvas, function () {
		oCanvas.updateDim();
		oCanvas.setDim();
	});
});