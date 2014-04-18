(function() {
    var avl = {
        version: "1.0.1-alpha"
    };

    // cache object constructor function
    function _LayerCache() {
    	var self = this,
    		cache = [],
    		choros = [];	// An array of objects with keys: attr, domain.

    	// Parameter: pleth - a geoJSON property name. The property's domain should be numeric.
    	self.addChoro = function(pleth) {
    		for (i in choros) {
    			if (choros[i].attr.toLowerCase() == pleth.toLowerCase())
    				return
    		}
    		choros.push({attr: pleth, domain: [null, null]});
    	}

    	self.putJSON = function(json, id) {
    		cache.push(new _CacheObject(json, id));
    		/*if (choros.length > 0) {
    			_findDomains(json.features);
    		}*/
    	}

    	function _findDomains(features) {
    		for (i in choros) {
    			_findDomain(features, choros[i]);
    		}
    	}

    	function _findDomain(features, choro) {
    		var min = choro.domain[0] || features[0][choro.attr],
    			max = choro.domain[1] || features[0][choro.attr];
    		for (i in features) {
    			// check for new domain min
    			if (features[i][choro.attr] < min)
    				choro.domain[0] = features[i][choro.attr];
    			// check for new domain max
    			if (features[i][choro.attr] > max)
    				choro.domain[1] = features[i][choro.attr];
    		}
    	}

    	self.getJSON = function(id) {
    		var i = _findID(id);
    		if (i > 0) {
    			return cache[i].getJSON();
    		}
    		return null;
    	}

    	function _findID(id) {
    		for (i in cache) {
    			if (cache[i].getID() == id) {
    				return i;
    			}
    		}
    		return -1;
    	}
    	// CacheObject constructor
    	function _CacheObject(json, id) {
    		var self = this;

    		self.getID = function() {
    			return id;
    		}
    		self.getJSON = function() {
    			return json;
    		}
    	}
    }

    // tile layer constructor function
    function _TileLayer(url, options) {
    	var self = this,
    		layer = null,
    		baseURL = url,
    		drawFunc,
    		cache = new _LayerCache(),
    		properties,		// Array of geoJSON property names.
    						// Creates classes from specified geoJSON properties.
    						// Each class is named using the following scheme:
    						//		.attribute_key-attribute_value

    		styles,			// Array of class names.
    						// Assigns the classes to all objects on the layer.

    		choros;			// Array  of objects with keys: attr, range.
    						// The attr key is a geoJSON property name.
    						// The range key is an array of colors.
    						// Creates a d3.js quantize scale with range of color,
    						//		and domain [min, max] of the attr key

    	if (typeof options !== 'undefined') {
    		drawFunc = options.func || _drawTile;
    		properties = options.properties || [];
    		styles = options.styles || [];
    		choros = options.choros || [];
    	} else {
    		drawFunc = _drawTile;
    		styles = [];
    		properties = [];
    		choros = [];
    	}

    	self.getURL = function() {
    		return url;
    	}

    	self.setURL = function(url) {
    		baseURL = url;
    	}

    	self.getDrawFunc = function() {
    		return drawFunc;
    	}

    	self.setDrawFunc = function(func) {
    		drawFunc = func;
    	}

    	self.getLayer = function() {
    		return layer;
    	}

    	self.setLayer = function(l) {
    		layer = l;
    	}

    	self.getChoros = function() {
    		return choros;
    	}

    	self.addChoro = function(pleths) {
    		for (i in pleths) {
    			if (choros.indexOf(pleths[i] === -1))
    				choros.push(pleths[i]);
    		}
    	}

    	self.getStyles = function() {
    		return styles;
    	}

    	self.addStyle = function(cls) {
    		for (i in cls) {
    			if (styles.indexOf(cls[i] === -1))
    				styles.push(cls[i]);
    		}
    	}

    	self.getProperties = function() {
    		return properties;
    	}

    	self.addProperty = function(props) {
    		for (i in props) {
    			if (properties.indexOf(props[i] === -1))
    				properties.push(props[i]);
    		}
    	}

    	var requests = [];

    	self.abortXHR = function(el) {
    		for (i in requests) {
    			if (requests[i] === el) {
    				el._xhr.abort();
    				requests.splice(i, 1);
    				return;
    			}
    		}
    	}

    	self.drawTile = function(SVG, d, tilePath) {
    		var id = 'tile-' + d.join('-');
    		var json = cache.getJSON(id);
    		if (json === null) {
    			requests.push(SVG);
    			var URL = makeURL(d, baseURL);
	  			SVG._xhr = d3.json(URL, function(error, data) {
    				drawFunc(SVG, d, tilePath, self, data);
    				cache.putJSON(data, id);
	  			});
    		} else {
    			drawFunc(SVG, d, tilePath, self, json);
    		}
    	}

	    function makeURL(d, url) {
			if (url.indexOf('http://tile.openstreetmap') === 0) {
				url = url.replace('http://', 'http://' + ["a", "b", "c"][(d[0] * 31 + d[1]) % 3] + '.')
			}
			url += "/" + d[2] + "/" + d[0] + "/" + d[1] + ".topojson";
			return url;
	    }
    }

    function _drawTile(SVG, d, tilePath, layer, json) {
	    json = topojson.feature(json, json.objects.vectile);
	    var k = Math.pow(2, d[2]+8);

	  	var svg = d3.select(SVG);

	    tilePath.projection()
	        .translate([k / 2 - d[0] * 256, k / 2 - d[1] * 256])
	        .scale(k / 2 / Math.PI);

	    //var choropleth = checkChoropleth(layer, json.features);

	    var paths = svg.selectAll("path")
	        .data(json.features)
	      	.enter().append("path")
	      	.attr('class', function(gj) {
	    		var cls = 'path';
	    		layer.getProperties().forEach(function(prop) {
	    			cls += ' ' + prop + '-' + gj.properties[prop];
	    		});
	    		layer.getStyles().forEach(function(style) {
	    			cls += ' ' + style;
	    		});
	    		return cls;
	    	})/*
	    	.each(function(d) {
	    		if (choropleth != false) {
	    			d3.select(this)
	    				.style(choropleth.style, choropleth.scale(d.properties[choropleth.attr]));
	    		}
	    	})*/
	        .attr("d", tilePath);
    }

	function _drawTile2(thing, d, tilePath, layer, url) {
		//console.log(url);

	  	var svg = d3.select(thing);

	  	thing._xhr = d3.json(url, function(error, json) {
		    //console.log(json);
		    json = topojson.feature(json, json.objects.vectile);
		    var k = Math.pow(2, d[2]+8); // size of the world in pixels
		    //console.log(json);

		    //layer.putCache();

		    tilePath.projection()
		        .translate([k / 2 - d[0] * 256, k / 2 - d[1] * 256]) // [0°,0°] in pixels
		        .scale(k / 2 / Math.PI);

		    //var choropleth = checkChoropleth(layer, json.features);

		    var paths = svg.selectAll("path")
		        .data(json.features)
		      	.enter().append("path")
		      	.attr('class', function(gj) {
		    		var cls = 'path';
		    		layer.getProperties().forEach(function(prop) {
		    			cls += ' ' + prop + '-' + gj.properties[prop];
		    		});
		    		layer.getStyles().forEach(function(style) {
		    			cls += ' ' + style;
		    		});
		    		return cls;
		    	})/*
		    	.each(function(d) {
		    		if (choropleth != false) {
		    			d3.select(this)
		    				.style(choropleth.style, choropleth.scale(d.properties[choropleth.attr]));
		    		}
		    	})*/
		        .attr("d", tilePath);
	  	});

		function checkChoropleth(layer, features) {
			return false
			if (features.length === 0)
				return

			var choros = layer.getChoros();
			if (choros === false)
				return false;

		    var	min = features[0].properties[choros.attr],
	    		max = features[0].properties[choros.attr],
	    		data = [],
	    		cur;

	    	features.forEach(function(f) {
	    		cur = f.properties[choros.attr];
	    		data.push(cur);
	    		if (cur > max)
	    			max = cur;
	    		if (cur < min)
	    			min = cur;
	    	});
	    	var choroScale = d3.scale.quantize()
	    			.domain([min, max])
	    			.range(choros.range);

	    	var obj = {scale: choroScale, attr: choros.attr};
	    	obj.style = choros.style || 'fill';

	    	return obj;
		}
	}

    // map constructor function
    function _Map(id, options) {//startLoc, startScale, scaleRange) {
    	var self = this;

    	self.IDtag = id;

		var tileLayer = d3.select(self.IDtag).append('g').attr('class', 'layer');

    	if (typeof options !== 'undefined') {
	    	self.startLoc = options.startLoc || [-73.8064, 42.6942]; // defaults to Albany, NY
	    	self.startScale = options.startScale || 1 << 15;
	    	self.scaleRange = options.scaleRange || [1 << 15, 1 << 25];
    	} else {
	    	self.startLoc = [-73.8064, 42.6942]; // defaults to Albany, NY
	    	self.startScale = 1 << 15;
	    	self.scaleRange = [1 << 11, 1 << 25];
    	}

    	var width = parseInt(d3.select(self.IDtag).style('width')),
    		height = parseInt(d3.select(self.IDtag).style('height')),
	    	prefix = prefixMatch(["webkit", "ms", "Moz", "O"]),
	    	layers = [];

    	var mapTile = d3.geo.tile().size([width, height]);

		var projection  = d3.geo.mercator()
		    .scale((self.startScale) / 2 / Math.PI)
		    .translate([-width / 2, -height / 2]);

		var tileProjection = d3.geo.mercator();

		var tilePath = d3.geo.path().projection(tileProjection);

		var zoom = d3.behavior.zoom()
		    .scale(projection.scale() * 2 * Math.PI)
		    .scaleExtent(self.scaleRange)
		    .translate(projection(self.startLoc).map(function(x) { return -x; }))
		    .on("zoom", zoomLayers);

		var map = d3.select(self.IDtag)
		    .attr("class", "map")
		    .style("width", width + "px")
		    .style("height", height + "px")
		    .call(zoom)
		    .on("mousemove", mousemoved);

		var info = map.append("div")
		    .attr("class", "info");

		function zoomLayers() {
			layers.forEach(function(layer) {
				zoomed(layer);
			});
		}

		function zoomed(layer) {
			var tiles = mapTile
			    .scale(zoom.scale())
			    .translate(zoom.translate())();

		  	projection
		      	.scale(zoom.scale() / 2 / Math.PI)
		      	.translate(zoom.translate());

		  	var image = layer.getLayer()
		  		.style(prefix + "transform", matrix3d(tiles.scale, tiles.translate))
		    	.selectAll(".tile")
		      	.data(tiles, function(d) { return d; });

		  	image.exit()
		    	.each(function(d) { layer.abortXHR(this); })//{ this._xhr.abort(); })
		    	.remove();

		  	image.enter().append('svg')
		    	.attr("class", 'tile')
		    	.style("left", function(d) { return d[0] * 256 + "px"; })
		    	.style("top", function(d) { return d[1] * 256 + "px"; })
		    	.each(function(d) {
		    		layer.drawTile(this, d, tilePath);
		    	});
		}

		function mousemoved() {
		  	info.text(formatLocation(projection.invert(d3.mouse(this)), zoom.scale()));
		}

		function formatLocation(p, k) {
		  	var format = d3.format("." + Math.floor(Math.log(k) / 2 - 2) + "f");
		  	return (p[1] < 0 ? format(-p[1]) + "°S" : format(p[1]) + "°N") + " "
		       	+ (p[0] < 0 ? format(-p[0]) + "°W" : format(p[0]) + "°E");
		}

		self.addLayer = function(layer) {
			if (typeof layer !== 'undefined') {
				layers.push(layer);
				layer.setLayer(d3.select(self.IDtag).append('g').attr('class', 'layer'));
				zoomed(layer);
			} else {
				throw new ObjectException("No Layer Object argument");
			}
		}

		self.removeLayer = function(layer) {
			var index = layers.indexOf(layer);
			if (index !== -1) {
				layers.splice(index, 1);
			}
		}
    }

	function matrix3d(scale, translate) {
	  	var k = scale / 256, r = scale % 1 ? Number : Math.round;
	  	return "matrix3d(" + [k, 0, 0, 0,
	  						  0, k, 0, 0,
	  						  0, 0, k, 0,
	  						  r(translate[0] * scale), r(translate[1] * scale), 0, 1 ] + ")";
	}

	function prefixMatch(p) {
	  	var i = -1, n = p.length, s = document.body.style;
	  	while (++i < n) if (p[i] + "Transform" in s) return "-" + p[i].toLowerCase() + "-";
	  	return "";
	}

	avl.TileLayer = function(url, options) {//func, classes) {
		if (typeof url !== 'undefined') {
			return new _TileLayer(url, options);//func, classes);
		} else {
			throw new ObjectException("You must specify a map URL");
		}
	}

	avl.Map = function(id, options) {//startLoc, startScale, scaleRange) {
		if (typeof id !== 'undefined') {
			if (document.getElementById(id) === null) {
		    	var width = Math.max(960, window.innerWidth),
		    		height = Math.max(500, window.innerHeight);

				d3.select('body').append('div')
					.attr('id', id.slice(1))
				    .style("width", width + "px")
				    .style("height", height + "px");
			}
			return new _Map(id, options);//startLoc, startScale, scaleRange);
		} else {
			throw new ObjectException("You must specify a map ID");
		}
	}

	// exception constructor
	function ObjectException(m) {
		this.type = 'ObjectException';
		this.msg = m;
		console.error(m);
	}

    this.avl = avl;
})()