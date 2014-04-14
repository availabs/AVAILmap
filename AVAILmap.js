(function() {
    var avl = {
        version: "1.0.1-alpha"
    };

    // tile layer constructor function
    function _TileLayer(url, options) {//func, properties) {
    	var self = this,
    		layer = null,
    		baseURL = url,
    		drawFunc,
    		properties;

    	if (typeof options !== 'undefined') {
    		drawFunc = options.func || drawTile;
    		properties = properties || {};
    	} else {
    		drawFunc = drawTile;
    		properties = {};
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

    	self.getProperties = function() {
    		return properties;
    	}

    	self.addProperty = function(prop) {
    		if (typeof prop !== 'object') {

    		}
    		for (key in prop) {
    			properties[key] = prop[key];
    		}
    	}

    	function _removeProperty(key) {
			if (typeof properties[key] !== 'undefined') {
				delete properties[key];
    		} else {
				throw new ObjectException("Property '" + key + "' does not exist");
			}
    	}

    	self.removeProperty = function(prop) {
    		for (key in prop) {
	    		try {
	    			_removeProperty(key);
	    		} catch(e) {
	    			continue
	    		}
	    	}
    	}
    }

	function drawTile(self, d, tilePath, layer) {
		var url = layer.getURL()
		if (url.indexOf('http://tile.openstreetmap') === 0) {
			url = url.replace('http://', 'http://' + ["a", "b", "c"][(d[0] * 31 + d[1]) % 3] + '.')
		}
		url += "/" + d[2] + "/" + d[0] + "/" + d[1] + ".topojson";
		//console.log(url);

	  	var svg = d3.select(self);

	  	self._xhr = d3.json(url, function(error, json) {
		    //console.log(json);
		    json = topojson.feature(json, json.objects.vectile);
		    var k = Math.pow(2, d[2]+8); // size of the world in pixels
		    //console.log(json);
		    tilePath.projection()
		        .translate([k / 2 - d[0] * 256, k / 2 - d[1] * 256]) // [0°,0°] in pixels
		        .scale(k / 2 / Math.PI);

		    svg.selectAll("path")
		        .data(json.features)
		      .enter().append("path")
		      	.attr('class', function() {
		    		var cls = 'path',
		    			props = layer.getProperties();
		    		for (key in props) {
		    			cls += ' ' + props[key];
		    		}
		    		return cls;
		    	})
		        .attr("d", tilePath);
	  	});
	}

    // map constructor function
    function _Map(id, options) {//startLoc, startScale, scaleRange) {
    	var self = this;

    	self.IDtag = id;
    	if (typeof options !== 'undefined') {
	    	self.startLoc = options.startLoc || [-73.8064, 42.6942]; // defaults to Albany, NY
	    	self.startScale = options.startScale || 1 << 15;
	    	self.scaleRange = options.scaleRange || [1 << 15, 1 << 25];
    	} else {
	    	self.startLoc = [-73.8064, 42.6942]; // defaults to Albany, NY
	    	self.startScale = 1 << 15;
	    	self.scaleRange = [1 << 15, 1 << 25];
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
			})
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
		    	.each(function(d) { this._xhr.abort(); })
		    	.remove();

		  	image.enter().append('svg')
		    	.attr("class", 'tile')
		    	.style("left", function(d) { return d[0] * 256 + "px"; })
		    	.style("top", function(d) { return d[1] * 256 + "px"; })
		    	.each(function(d) {
		      		layer.getDrawFunc()(this, d, tilePath, layer);
		    	})
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
				layer.setLayer(d3.select('.map').append('div').attr('class', 'layer'));
				zoomed(layer);
			} else {
				throw new ObjectException("No Layer Object argument");
			}
		}

		self.removeLayer = function(layer) {
			var index = layers.indexOf(layers);
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