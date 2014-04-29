(function() {
    var avl = {
        version: "1.0.1-alpha"
    };

    // cache object constructor function
    function _LayerCache() {
    	var self = this,
    		cache = [];

    	self.putJSON = function(json, id) {
    		cache.push(new _CacheObject(json, id));
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
    		zIndex,
    		hover,			// false or stores a class name that is applied to polygons on mouseover
    		IDtag,
    		tilePath,
    		map,
    		cache = new _LayerCache(),
    		requests = [],	// Array to store XML HTTP Requests
    		properties,		// Array of geoJSON property names.
    						// Creates classes from specified geoJSON properties.
    						// Each class is named using the following scheme:
    						//		.attribute_key-attribute_value

    		styles,			// Array of class names.
    						// Assigns the classes to all objects on the layer.

    		choros;			// Not implemented

    	if (typeof options !== 'undefined') {
    		drawFunc = options.func || _drawTile;
    		properties = options.properties || [];
    		styles = options.styles || [];
    		choros = options.choros || [];
    		zIndex = options.zIndex || 0;
    		hover = options.hover || false;
    	} else {
    		drawFunc = _drawTile;
    		styles = [];
    		properties = [];
    		choros = [];
    		zIndex = 0;
    		hover = false;
    	}

    	self.getID = function() {
    		return IDtag;
    	}

    	self.setID = function(id) {
    		IDtag = id;
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

    	self.setTilePath = function(tp) {
    		tilePath = tp;
    	}

    	self.setMap = function(m) {
    		map = m;
    	}

    	self.getHover =function() {
    		return hover;
    	}

    	self.getZIndex = function() {
    		return zIndex;
    	}

    	function _addAttributes(lst, atts) {
    		var len = lst.length;
    		for (i in atts) {
    			if (lst.indexOf(atts[i] === -1))
    				lst.push(atts[i]);
    		}
    		if (len !== lst.length) {
    			map.drawLayer(self);
    		}
    	}

    	function _removeAttributes(lst, atts) {
    		var len = lst.length;
    		for (var i = atts.length-1; i >= 0; i--) {
    			if (lst.indexOf(atts[i] !== -1))
    				lst.splice(i, 1);
    		}
    		if (len !== lst.length) {
    			map.drawLayer(self);
    		}
    	}

    	self.getChoros = function() {
    		console.log('Not implemented');
    	}
    	self.addChoros = function(pleths) {
    		console.log('Not implemented');
    	}
    	self.removeChoros = function(pleths) {
    		console.log('Not implemented');
    	}

    	self.getStyles = function() {
    		return styles;
    	}
    	self.addStyles = function(cls) {
    		_addAttributes(styles, cls);
    	}
    	self.removeStyles = function(cls) {
    		_removeAttributes(styles, cls);
    	}

    	self.getProperties = function() {
    		return properties;
    	}
    	self.addProperties = function(props) {
    		_addAttributes(properties, props);
    	}
    	self.removeProperties = function(props) {
    		_removeAttributes(properties, props);
    	}

    	self.abortXHR = function(d) {
    		var id = _generateTileID(d);
    		for (var i = requests.length-1; i >= 0; i--) {
    			if (requests[i].getTag() === id) {
    				requests[i].abort();
    				requests.splice(i, 1);
    				break;
    			}
    		}
    	}

    	function _removeXHR(xhr) {
    		for (i in requests) {
    			if (requests[i] === xhr) {
    				requests.splice(i, 1);
    				break;
    			}
    		}
    	}

    	self.drawTile = function(SVG, d) {
    		var id = _generateTileID(d);
    		var json = cache.getJSON(id);
    		if (json === null) {
    			var xhr = new _Request(id),
    				URL = _makeURL(d, baseURL);
    			requests.push(xhr);
	  			xhr.setXHR(d3.json(URL, function(error, data) {
    				_removeXHR(xhr);
    				cache.putJSON(data, id);
    				drawFunc(SVG, d, tilePath, self, data);
	  			}));
    		} else {
    			drawFunc(SVG, d, tilePath, self, json);
    		}
    	}

	    function _makeURL(d, url) {
			if (url.indexOf('http://tile.openstreetmap') === 0) {
				url = url.replace('http://', 'http://' + ["a", "b", "c"][(d[0] * 31 + d[1]) % 3] + '.')
			}
			url += "/" + d[2] + "/" + d[0] + "/" + d[1] + ".topojson";
			return url;
	    }

	    // XHR object constructor
	    function _Request(tag) {
	    	var self = this,
				_tag = tag,
	    		_xhr = null;

	    	self.getTag = function() {
	    		return _tag;
	    	}
	    	self.getXHR = function() {
	    		return _xhr;
	    	}
	    	self.setXHR = function(xhr) {
	    		_xhr = xhr;
	    	}
	    	self.abort = function() {
	    		_xhr.abort();
	    	}
	    }
    }

    function _generateTileID(d) {
    	return 'tile-' + d.join('-');
    }

    function _drawTile(SVG, d, tilePath, layer, json) {
	    json = topojson.feature(json, json.objects.vectile);
	    var k = Math.pow(2, d[2]+8);

	  	var svg = d3.select(SVG);

	  	var pathLayerID = layer.getID();

	    tilePath.projection()
	        .translate([k / 2 - d[0] * 256, k / 2 - d[1] * 256])
	        .scale(k / 2 / Math.PI);

	    var paths = svg.selectAll('.'+pathLayerID)
	        .data(json.features)
	      	.enter().append("path")
	      	.attr('class', function(d) {
	    		var cls = 'path' + ' ' + pathLayerID;

	    		layer.getProperties().forEach(function(prop) {
	    			cls += ' ' + prop + '-' + d.properties[prop];
	    		});

	    		layer.getStyles().forEach(function(style) {
	    			cls += ' ' + style;
	    		});
	    		return cls;
	    	})
	        .attr("d", tilePath);

	  	var hover = layer.getHover();

    	if (hover !== false) {
	    	paths.each(function(d) {
    			var path = d3.select(this),
    				tag = 'path-' + d.id;

    			path.classed(tag, true)
    				.on('mouseover', function(d) {
	    				d3.selectAll('.'+tag).classed(hover, true);
			    	})
			    	.on('mouseout', function(d) {
	    				d3.selectAll('.'+tag).classed(hover, false);
			    	});
	    	});
	    }
    }

    // map constructor function
    function _Map(id, options) {
    	var self = this,
	    	layers = [],
    		layerIDs = 0;

    	self.IDtag = id;

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
	    	prefix = prefixMatch(["webkit", "ms", "Moz", "O"]);

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
		    .on("zoom", zoomMap);

		var map = d3.select(self.IDtag)
		    .attr("class", "map")
		    .style("width", width + "px")
		    .style("height", height + "px")
		    .call(zoom)
		    .on("mousemove", mouseMoved);

		var layersDiv = map.append("div")
			.attr('id', 'z-index-0')
		    .attr("class", "layersDiv");

		var info = map.append("div")
		    .attr("class", "info");

		function zoomMap() {
			var tiles = mapTile
			    .scale(zoom.scale())
			    .translate(zoom.translate())();

		  	projection
		      	.scale(zoom.scale() / 2 / Math.PI)
		      	.translate(zoom.translate());

		  	var layerTiles = layersDiv
		  		.style(prefix + "transform", matrix3d(tiles.scale, tiles.translate))
		    	.selectAll(".tile")
		      	.data(tiles, function(d) { return d; });

		  	layerTiles.exit()
		    	.each(function(d) {
		    		for (i in layers) {
		    			layers[i].abortXHR(d);
		    		}
		    	})
		    	.remove();

		  	layerTiles.enter().append('svg')
		    	.attr("class", 'tile')
		    	.style("left", function(d) { return d[0] * 256 + "px"; })
		    	.style("top", function(d) { return d[1] * 256 + "px"; })
		    	.each(function(d) {
		    		for (i in layers) {
		    			layers[i].drawTile(this, d);
		    		}
		    	});
		}

		function _drawLayer(layerObj) {
			var tiles = mapTile
			    .scale(zoom.scale())
			    .translate(zoom.translate())();

		  	var layerTiles = layersDiv
		  		.style(prefix + "transform", matrix3d(tiles.scale, tiles.translate))
		    	.selectAll(".tile")
		      	.data(tiles, function(d) { return d; });

		  	layerTiles.each(function(d) {
		    		layerObj.drawTile(this, d);
		    	});
		}

		self.drawLayer = function(layerObj) {
			_drawLayer(layerObj);
		}

		function mouseMoved() {
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

				layers.sort(function(a, b) {
					return a.getZIndex() - b.getZIndex();
				});

				layer.setID('layer-'+(layerIDs++));
				layer.setTilePath(tilePath);
				layer.setMap(self);

				if (layers.length === 1) {
					zoomMap();
				} else {
					_drawLayer(layer);
				}
			} else {
				throw new ObjectException("No Layer Object argument");
			}
		}

		self.removeLayer = function(layer) {
			var index = layers.indexOf(layer);
			if (index !== -1) {
				layers.splice(index, 1);
				d3.selectAll('.'+layer.getID()).remove();
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

	avl.TileLayer = function(url, options) {
		if (typeof url !== 'undefined') {
			return new _TileLayer(url, options);
		} else {
			throw new ObjectException("You must specify a map URL");
		}
	}

	avl.Map = function(id, options) {
		if (typeof id !== 'undefined') {
			if (document.getElementById(id) === null) {
		    	var width = Math.max(960, window.innerWidth),
		    		height = Math.max(500, window.innerHeight);

				d3.select('body').append('div')
					.attr('id', id.slice(1))
				    .style("width", width + "px")
				    .style("height", height + "px");
			}
			return new _Map(id, options);
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