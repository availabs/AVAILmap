(function() {
    var avl = {
        version: "0.2.1-alpha"
    };

    // XHR object constructor function
    function _avlXHR(id, url, obj) {
        var self = this,
            _xhr = _getXHR();

        self.get = function(callback) {
            _xhr.get(function(error, data) {
                if (callback !== undefined) {
                    callback(error, data);
                }
            })
        }

        self.post = function(data, callback) {
            _xhr.post(JSON.stringify(data), function(error, data) {
                if (callback !== undefined) {
                    callback(error, data);
                }
            })
        }

        self.abort = function() {
            _xhr.abort();
        }

        self.delete = function() {
            delete obj[id];
        }

        self.id = function(t) {
            if (!t) {
                return id;
            } else {
                id = t;
                return self;
            }
        }

        function _getXHR() {
            return d3.xhr(url)
                .response(function(request) {
                    return JSON.parse(request.responseText);
                })
        }
    }

    // cache object constructor function
    function _LayerCache() {
        var self = this,
            cache = {};

        self.putJSON = function(json, id) {
            cache[id] = json;
        }
        self.getJSON = function(id) {
            return cache[id];
        }
    }

    // tile layer constructor function
    function _TileLayer(url, options) {
        var self = this,
            layer = null,
            baseURL = url,
            drawFunc,
            zIndex,
            IDtag,
            tilePath,
            map,
            name,
            cache = new _LayerCache(),
            dataType,
            dataDecoder,
            visibility = 'visible',     // variable to track layer visibility
            requests = {},  // Object to store XML HTTP Requests
            hover,          // false or an array containing an array of pairs.
                            // Each pair uses the following scheme:
                            //      [style, attribute_key]
                            // This applies the style to all objects with the same value
                            //      from the objects' attribute_key when the object is moused over
            properties,     // Array of geoJSON property names.
                            // Creates classes from specified geoJSON properties.
                            // Each class is named using the following scheme:
                            //      .attribute_key-attribute_value

            styles,         // Array of class names.
                            // Assigns the classes to all objects on the layer.

            choros;         // Not implemented

        if (typeof options !== 'undefined') {
            drawFunc = options.func || _drawTile;
            properties = options.properties || [];
            styles = options.styles || [];
            choros = options.choros || false;
            zIndex = options.zIndex || 0;
            hover = options.hover || false;
            name = options.name || null;
            dataType = options.dataType || 'geojson';
            dataDecoder = options.decoder || null;
        } else {
            drawFunc = _drawTile;
            styles = [];
            properties = [];
            choros = false;
            zIndex = 0;
            hover = false;
            name = null;
            dataType = 'geojson';
            dataDecoder = null;
        }

        if (dataDecoder === null) {
            switch(dataType) { 
                case 'geojson':
                    dataDecoder = null;
                    break;
                case 'topojson':
                    dataDecoder = _decode_topoJSON;
                    break;
            }
        }

        for (var i in choros) {
        	if ('domain' in choros[i]) {
        		choros[i].scale = d3.scale.quantize()
        			.domain(choros[i].domain)
        			.range(choros[i].range);
        	}
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

        self.getName = function() {
            return name;
        }
        self.setName = function(n) {
            name = n;
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

        self.getHover =function() {
            return hover;
        }
        self.addHover = function(hvr) {
            _addAttributes(hover, hvr);
        }
        self.removeHover = function(hvr) {
            _removeAttributes(hover, hvr);
        }

        self.getChoros = function() {
        	return choros;
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

        self.abortXHR = function(id) {
            if (id in requests) {
                requests[id].abort();
                requests[id].delete();
            }
        }

        self.drawTile = function(SVG, d) {
            var id = _generateTileID(d),
                json = cache.getJSON(id);

            if (json === undefined) {
                var URL = _makeURL(d, baseURL),
                    xhr = new _avlXHR(id, URL, requests);

                requests[id] = xhr;

                xhr.get(function(error, data) {
                    xhr.delete();

                    if (error) {
                        return false;
                    }
                    var json;
                    if (dataDecoder !== null) {
                        json = dataDecoder(data);
                    } else {
                        json = data;
                    }

                    cache.putJSON(json, id);
                    drawFunc(SVG, d, tilePath, self, json);
                });
            } else {
                drawFunc(SVG, d, tilePath, self, json);
            }
        }

        self.getVisibility = function() {
            return visibility;
        }
        self.hide = function() {
            visibility = (visibility === 'visible' ? 'hidden' : 'visible');
            d3.selectAll('.'+IDtag).style('visibility', visibility);
        }

        function _makeURL(d, url) {
            if (url.indexOf('http://tile.openstreetmap') === 0) {
                url = url.replace('http://', 'http://' + ["a", "b", "c"][(d[0] * 31 + d[1]) % 3] + '.')
            }
            url += "/" + d[2] + "/" + d[0] + "/" + d[1] + "."+dataType;
            return url;
        }

        function _decode_topoJSON(data) {
            return topojson.feature(data, data.objects.vectile);
        }
    }

    function RasterLayer(url, options) {
        var self = this;

        self.drawTile = function(DIV, d) {

        }
    }

    function _generateTileID(d) {
        return 'tile-' + d.join('-');
    }

    function _drawTile(SVG, d, tilePath, layer, json) {
        var k = (1 << d[2]) * 256;

        var svg = d3.select(SVG);

        var pathLayerID = layer.getID();

        var regex = /\d{4}\./;

        tilePath.projection()
            .translate([k / 2 - d[0] * 256, k / 2 - d[1] * 256])
            .scale(k / 2 / Math.PI);

        var visibility = layer.getVisibility();

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
            .attr("d", function(d) {
				var path = tilePath(d);
				if (!regex.test(path))
					return path;

            	var segments = path.split('M');
            	for (var i in segments) {
            		if (Math.abs(parseInt(segments[i])) > 256) {
            			segments.splice(i, 1);
            		}
            	}
				return segments.join('M');
			})
            .style('visibility', visibility);

        var choros = layer.getChoros();

        if (choros !== false) {
			paths.each(function(d) {
                var path = d3.select(this);
                choros.forEach(function(chr) {
                	path.style(chr.style, chr.scale(d.properties[chr.attr]))
                });
            });
        }

        var hover = layer.getHover();

        if (hover !== false) {
            paths.each(function(d) {
                var path = d3.select(this);
                hover.forEach(function(hvr) {
                    var prop = d.properties[hvr[1]];

                    if (!prop)
                        return;

                    var tag = 'hover-' + prop.replace(/[\s]/g, '').replace(/\b\d/, '').replace(/[^\w_]/, '');

                    path.classed(tag, true)
                        .on('mouseover', function() {
                            d3.selectAll('.'+tag).classed(hvr[0], true);
                        })
                        .on('mouseout', function() {
                            d3.selectAll('.'+tag).classed(hvr[0], false);
                        });
                });
            });
        }
    }

    function _Control(id) {
        var self = this,
            IDtag = id,
            position = false,
            DOMel = null;

        self.init = function(obj) {
            DOMel = d3.select(obj.getID());
        }

        self.getID = function() {
            return id;
        }

        self.getPosition = function() {
            return position;
        }
        self.setPosition = function(p) {
            if (position !== false) {
                DOMel.classed(position, false);
            }
            position = p;
            DOMel.classed(position, true);
        }
    }

    function _InfoControl(map, projection, zoom, position) {
        var self = this;

        map.on("mousemove", _mouseMoved);

        var info = map.append("div")
            .attr('id', 'info-control')
            .attr("class", "control")
            .append('div')
            .attr('id', 'info-text');

        self.init(self);
        self.setPosition(position);

        function _mouseMoved() {
            info.text( _formatLocation( projection.invert(d3.mouse(this)), zoom.scale() ) );
        }

        function _formatLocation(p, k) {
            var format = d3.format("." + Math.floor(Math.log(k) / 2 - 2) + "f");
            return (p[1] < 0 ? format(-p[1]) + "°S" : format(p[1]) + "°N") + " "
                + (p[0] < 0 ? format(-p[0]) + "°W" : format(p[0]) + "°E");
        }
    }
    _InfoControl.prototype = new _Control('#info-control');
    _InfoControl.prototype.constructor = _InfoControl;

    function _ZoomControl(mapObj, map, zoom, position) {
        var self = this,
            width = parseInt(d3.select(mapObj.getID()).style('width')),
            height = parseInt(d3.select(mapObj.getID()).style('height'));

        var zoomButtons = map.append('div')
            .attr('id', 'zoom-control')
            .attr('class', 'control')
            .on('dblclick', function() {
                d3.event.stopPropagation();
            });

        self.init(self);
        self.setPosition(position);

        zoomButtons.append('div')
            .attr('class', 'button active bold')
            .text('+')
            .on('mouseup', function() {
                _clicked(1);
            })

        zoomButtons.append('div')
            .attr('class', 'button active bold')
            .text('-')
            .on('mouseup', function() {
                _clicked(-1);
            })

        function _clicked(direction) {
            var scale = 2.0,
                targetZoom = Math.round(zoom.scale() * Math.pow(scale, direction)),
                center = [width/2, height/2],
                extent = zoom.scaleExtent(),
                translate = zoom.translate(),
                translate0 = [],
                l = [],
                view = {
                    x: translate[0],
                    y: translate[1],
                    k: zoom.scale()
                };

            d3.event.preventDefault();

            if (targetZoom < extent[0] || targetZoom > extent[1]) {
                return false;
            }
            translate0 = [(center[0]-view.x)/view.k, (center[1]-view.y)/view.k];

            view.k = targetZoom;

            l = [translate0[0]*view.k+view.x, translate0[1]*view.k+view.y];

            view.x += center[0]-l[0];
            view.y += center[1]-l[1];

            zoom.scale(view.k)
                .translate([view.x, view.y]);

            mapObj.zoomMap();
        }
    }
    _ZoomControl.prototype = new _Control('#zoom-control');
    _ZoomControl.prototype.constructor = _ZoomControl;

    function _LayerControl(mapObj, map, projection, zoom, position) {
        var self = this,
            layers = mapObj.getLayers();

        var layerDisplayer = map.append('div')
            .attr('id', 'layer-control')
            .attr('class', 'control')
            .on('dblclick', function() {
                d3.event.stopPropagation();
            })
            .on('mouseover', function() {
                d3.select(this).selectAll('div')
                    .each(function(d, i) {
                        var el = d3.select(this);
                        el.text(d.getName())
                            .style('padding', function() {
                                var border = parseInt(el.style('border')),
                                    padding = parseInt(el.style('padding')),
                                    width = Math.floor(parseInt(el.style('width')) / 2);

                                return Math.max(0, padding - border) + 'px ' + (width - border) + 'px';
                            })
                            .style('width', 'auto');
                    })
            })
            .on('mouseout', function() {
                d3.select(this).selectAll('div')
                    .each(function(d, i) {
                        d3.select(this)
                            .text(i)
                            .style('padding', null)
                            .style('width', null);
                    })
            });

        self.init(self);
        self.setPosition(position);

        _updateLayers();

        self.add = function(layer) {
        	if (layers.indexOf(layer) === -1) {
        		layers.push(layer);
        	}
            _updateLayers();
        }

        function _updateLayers() {
            var buttons = layerDisplayer
                .selectAll('div')
                .data(layers);

            buttons.exit().remove();

            buttons.enter().append('div')
                .attr('class', 'button active')
                .text(function(d, i) { return i; })
                .on('click', function(d) {
                    d.hide();
                    var active = (d.getVisibility() === 'visible' ? true : false);
                    d3.select(this)
                        .classed('active', active)
                        .classed('inactive', !active);
                });
        }
    }
    _LayerControl.prototype = new _Control('#layer-control');
    _LayerControl.prototype.constructor = _LayerControl;

    function _MarkerControl(mapObj, map, projection, zoom, position) {
    	var self = this,
            width = parseInt(d3.select(mapObj.getID()).style('width')),
            height = parseInt(d3.select(mapObj.getID()).style('height'));
    		markers = mapObj.getMarkers();

        var markerController = map.append('div')
            .attr('id', 'marker-control')
            .attr('class', 'control')
            .on('dblclick', function() {
                d3.event.stopPropagation();
            })
            .on('mouseover', function() {
                d3.select(this).selectAll('div')
                    .each(function(d, i) {
                        var el = d3.select(this);
                        el.text(d.getName())
                            .style('padding', function() {
                                var border = parseInt(el.style('border')),
                                    padding = parseInt(el.style('padding')),
                                    width = Math.floor(parseInt(el.style('width')) / 2);

                                return Math.max(0, padding - border) + 'px ' + (width - border) + 'px';
                            })
                            .style('width', 'auto');
                    })
            })
            .on('mouseout', function() {
                d3.select(this).selectAll('div')
                    .each(function(d, i) {
                        d3.select(this)
                            .text(i)
                            .style('padding', null)
                            .style('width', null);
                    })
            });;

        self.init(self);
        self.setPosition(position);

        _updateMarkers()

        self.add = function(marker) {
        	if (markers.indexOf(marker) === -1) {
        		markers.push(marker);
        	}
            _updateMarkers();
        }

        function _updateMarkers() {
            var buttons = markerController
                .selectAll('div')
                .data(markers);

            buttons.exit().remove();

            buttons.enter().append('div')
                .attr('class', 'button active')
                .text(function(d, i) { return i; })
                .on('click', function(d) {
            		projection
					    //.scale(1 << 19)
					    .center(d.getCoords()) // temporarily set center
					    .translate([width / 2, height / 2])
					    .translate(projection([0, 0])) // compute appropriate translate
					    .center([0, 0]); // reset

					zoom
					    //.scale(projection.scale())
					    .translate(projection.translate());

            		mapObj.zoomMap();
                });
        }
    }
    _MarkerControl.prototype = new _Control('#marker-control');
    _MarkerControl.prototype.constructor = _MarkerControl;

    // main controls container constructor function
    function _Controls(mapObj, projection, zoom) {
        var self = this,
        	controls = {},
            map = d3.select(mapObj.getID()),
            allPositions = ['top-right', 'bottom-right', 'bottom-left', 'top-left'],
            positionsUsed = [];

        self.addControl = function(type, position) {
            if (allPositions.indexOf(position) === -1) {
                position = 'top-right';
            }
            while ( _isAvailable(position) === false ) {
                position = allPositions[(allPositions.indexOf(position) + 1) % allPositions.length];
            }
            if (type === 'info' && !controls.info) {
                controls.info = new _InfoControl(map, projection, zoom, position);
            }
            else if (type === 'zoom' && !controls.zoom) {
                controls.zoom = new _ZoomControl(mapObj, map, zoom, position);
            }
            else if (type === 'layer' && !controls.layer) {
                controls.layer = new _LayerControl(mapObj, map, projection, zoom, position);
            }
            else if (type === 'marker' && !controls.marker) {
                controls.marker = new _MarkerControl(mapObj, map, projection, zoom, position);
            }
            positionsUsed.push(position);
        }

        self.update = function(args) {
        	var layer = args.layer || false,
        		marker = args.marker || false;

        	if (layer !== false && controls.layer) {
        		controls.layer.add(layer);
        	}
        	if (marker !== false && controls.marker) {
        		controls.marker.add(marker);
        	}
        }

        function _isAvailable(position) {
            for (i in positionsUsed) {
                if (position === positionsUsed[i]) {
                    return false;
                }
            }
            return true;
        }
    }

    function _MapMarker(coords, IDtag, mapObj, projection) {
        var self = this,
            screenXY = [],
            map = d3.select(mapObj.getID()),
            drag = d3.behavior.drag()
                .on("dragstart", dragstarted)
                .on("drag", dragged)
                .on("dragend", dragended),
            marker = map.append('div')
                .attr('class', 'avl-marker')
                .call(drag),
            height = parseInt(marker.style('height')),
            width = parseInt(marker.style('width'))/2,
            top = projection(coords)[1]-height,
            left = projection(coords)[0]-width,
            offsetX = 0,
            offsetY = 0,
            name;

        self.update = function() {
            top = projection(coords)[1]-height;
            left = projection(coords)[0]-width;

            marker.style('left', left+'px')
                .style('top', top+'px');

            return self;
        }

        self.coords = function(c) {
            if (c === undefined) {
        	   return coords;
            }
            coords = c;
            self.update()
            return self;
        }

        self.name = function(n) {
            if (n === undefined) {
        	   return name;
            }
            name = n;
            return self;
        }

        self.id = function(id) {
            if (id === undefined) {
                return IDtag;
            }
            IDtag = id;
            
        }

        function dragstarted() {
            d3.event.sourceEvent.stopPropagation();
            offsetX = d3.event.sourceEvent.offsetX;
            offsetY = d3.event.sourceEvent.offsetY;
        }
        function dragged() {
            d3.select(this)
                .style('left', (d3.event.x-offsetX) + 'px')
                .style('top', (d3.event.y-offsetY) + 'px');
            screenXY = [(d3.event.x+width-offsetX), (d3.event.y+height-offsetY)];
        }
        function dragended() {
            coords =  projection.invert(screenXY);
        }
    }

    // map constructor function
    function _Map(IDtag, options, cntrls) {
        var self = this,
            //IDtag = id,
            layers = [],
            layerIDs = 0,
            markerIDs = 0,
        	markers = [];

        var controls = null;

        var minZoom = 5,
            maxZoom = 17,
            zoomAdjust = 8,
            defaultCoords = [-73.824, 42.686], // defaults to Albany, NY
            startLoc,
            startScale,
            scaleExtent;
        
        if (typeof options !== 'undefined') {
            startLoc = options.startLoc || defaultCoords;
            startScale = options.startScale || minZoom;
            scaleExtent = options.scaleExtent || [minZoom, maxZoom];
        } else {
            startLoc = defaultCoords;
            startScale = minZoom;
            scaleExtent = [minZoom, maxZoom];
        }

        startScale = 1 << (startScale + zoomAdjust);
        scaleExtent = [1 << (scaleExtent[0] + zoomAdjust), 1 << (scaleExtent[1] + zoomAdjust)];

        var width = parseInt(d3.select(IDtag).style('width')),
            height = parseInt(d3.select(IDtag).style('height')),
            prefix = prefixMatch(["webkit", "ms", "Moz", "O"]);

        var mapTile = d3.geo.tile().size([width, height]);

        var projection  = d3.geo.mercator()
            .scale((startScale) / 2 / Math.PI)
            .translate([-width / 2, -height / 2]);

        var tileProjection = d3.geo.mercator();

        var tilePath = d3.geo.path().projection(tileProjection);

        var zoom = d3.behavior.zoom()
            .scale(startScale)
            .scaleExtent(scaleExtent)
            .translate(projection(startLoc).map(function(x) { return -x; }))
            .on("zoom", _zoomMap);

        var map = d3.select(IDtag)
            .attr("class", "map")
            .style("width", width + "px")
            .style("height", height + "px")
            .call(zoom);

        var layersDiv = map.append("div")
            .attr("class", "layersDiv");

        function _zoomMap() {
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
                    var id = _generateTileID(d), i;
                    for (i in layers) {
                        layers[i].abortXHR(id);
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

            for (var i in markers) {
                markers[i].update();
            }
        }

        self.drawLayer = function(layerObj) {
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

        self.addLayer = function(layer) {
            if (typeof layer !== 'undefined') {
                layers.push(layer);

                layers.sort(function(a, b) {
                    return a.getZIndex() - b.getZIndex();
                });

                layer.setID('layer-'+(++layerIDs));
                layer.setTilePath(tilePath);
                layer.setMap(self);

                if (layer.getName() === null) {
                    layer.setName(layer.getID());
                }

                if (controls !== null) {
                	controls.update({layer: layer});
                }

                if (layers.length === 1) {
                    _zoomMap();
                } else {
                    self.drawLayer(layer);
                }
            } else {
                throw new ObjectException("No Layer Object argument");
            }
            return self;
        }

        self.removeLayer = function(layer) {
            console.log("Not implemented")
        }

        self.addMarker = function(coords, options) {
            var id = 'marker-'+ (++markerIDs),
                marker = new _MapMarker(coords, id, self, projection),
                name = id;

        	if (typeof options !== 'undefined') {
        		name = options.name || name;
        	}
            marker.setName(name);
            marker.update();
            markers.push(marker);

            if (controls !== null) {
            	controls.update({marker: marker});
            }

            return self;
        }
        self.getMarkers = function() {
        	return markers;
        }

        var rasterLayer = null;
        self.addRasterLayer = function(rLayer) {
            if (rasterLayer !== null) {
                throw new ObjectException("A raster layer already exists!");
            }
            rasterLayer = rLayer;
        }

        self.zoomMap = function() {
            _zoomMap();
        }

        self.getLayers = function() {
            return layers;
        }

        self.getID = function() {
            return IDtag;
        }

        self.addControl = function(type, position) {
            if (controls === null) {
                controls = new _Controls(self, projection, zoom);
            }
            controls.addControl(type, position);
            return self;
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