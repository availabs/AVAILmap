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
            IDtag,
            tilePath,
            map,
            name = null,
            cache = new _LayerCache(),
            requests = [],  // Array to store XML HTTP Requests
            hover,          // false or stores an object with following key: value pair:
                            //      attribute_key: style
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
            choros = options.choros || [];
            zIndex = options.zIndex || 0;
            hover = options.hover || false;
            name = options.name || null;
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
        self.setHover = function(h) {
            hover = h;
            map.drawLayer(self);
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
                    if (error) {
                        return false;
                    }
                    cache.putJSON(data, id);
                    drawFunc(SVG, d, tilePath, self, data);
                }));
            } else {
                drawFunc(SVG, d, tilePath, self, json);
            }
        }
        var visibility = 'visible';
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
        var k = (1 << d[2]) * 256;

        var svg = d3.select(SVG);

        var pathLayerID = layer.getID();

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
            .attr("d", tilePath)
            .style('visibility', visibility);

        var hover = layer.getHover();

        if (hover !== false) {
            paths.each(function(d) {
                var prop = d.properties[hover[0]];

                if (!prop)
                    return;

                var tag = 'hover-' + prop.replace(/[\s]/g, '').replace(/\b\d/, '').replace(/[^\w_]/, ''),
                    path = d3.select(this);

                path.classed(tag, true)
                    .on('mouseover', function(d) {
                        d3.selectAll('.'+tag).classed(hover[1], true);
                    })
                    .on('mouseout', function(d) {
                        d3.selectAll('.'+tag).classed(hover[1], false);
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

        self.update = function(arg) {
            return;
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
            layers = [];

        var layerDisplayer = map.append('div')
            .attr('id', 'layer-control')
            .attr('class', 'control')
            .on('dblclick', function() {
                d3.event.stopPropagation();
            })
            .on('mouseover', function() {
                d3.select(this).selectAll('div')
                    .each(function(d, i) {
                        var DOMel = d3.select(this);
                        DOMel.text(d.getName())
                            .style('padding', function() {
                                var border = parseInt(DOMel.style('border')),
                                    padding = parseInt(DOMel.style('padding')),
                                    width = Math.floor(parseInt(DOMel.style('width')) / 2);

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

        self.update = function(arg) {
            _updateLayers();
        }
        function _updateLayers() {
            layers = mapObj.getLayers();
            
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
                })/*
                .on('mouseover', function(d) {
                    d3.select(this)
                        .text(d.getName())
                        .style('padding', '0 10px 0 10px')
                        .style('width', 'auto');
                })
                .on('mouseout', function(d, i) {
                    d3.select(this)
                        .text(i)
                        .style('padding', null)
                        .style('width', null);
                })*/;
        }
    }
    _LayerControl.prototype = new _Control('#layer-control');
    _LayerControl.prototype.constructor = _LayerControl;

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
            positionsUsed.push(position);
        }

        self.update = function(arg) {
            for (control in controls) {
                controls[control].update(arg);
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

    function _MapMarker(coords, mapObj, projection) {
        var self = this,
            screenXY = [],
            map = d3.select(mapObj.getID()),
            drag = d3.behavior.drag()
                .on("dragstart", dragstarted)
                .on("drag", dragged)
                .on("dragend", dragended),
            marker = map.append('div')
                .attr('class', 'marker')
                .call(drag);

        self.update = function() {
            marker.style('left', projection(coords)[0]+'px')
                .style('top', projection(coords)[1]+'px');
        }

        function dragstarted() {
            d3.event.sourceEvent.stopPropagation();
        }

        function dragged() {
            d3.select(this)
                .style('left', d3.event.x + 'px')
                .style('top', d3.event.y + 'px');
            screenXY = [d3.event.x, d3.event.y]
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
            layerIDs = 0;

        var controls = null;

        var minZoom = 7,
            maxZoom = 17,
            zoomAdjust = 8,
            defaultCoords = [-73.824, 42.686], // defaults to Albany, NY
            startLoc,
            startScale,
            scaleRange;
        
        if (typeof options !== 'undefined') {
            startLoc = options.startLoc || defaultCoords;
            startScale = options.startScale || minZoom;
            scaleRange = options.scaleRange || [minZoom, maxZoom];
        } else {
            startLoc = defaultCoords;
            startScale = minZoom;
            scaleRange = [minZoom, maxZoom];
        }

        startScale = 1 << (startScale + zoomAdjust);
        scaleRange = [1 << (scaleRange[0] + zoomAdjust), 1 << (scaleRange[1] + zoomAdjust)];

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
            .scaleExtent(scaleRange)
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

            for (var i in markers) {
                markers[i].update();
            }
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

        self.addLayer = function(layer) {
            if (typeof layer !== 'undefined') {
                layers.push(layer);

                layers.sort(function(a, b) {
                    return a.getZIndex() - b.getZIndex();
                });

                layer.setID('layer-'+(layerIDs++));
                layer.setTilePath(tilePath);
                layer.setMap(self);
                if (layer.getName() === null) {
                    layer.setName('Layer ' + (layers.length - 1));
                }

                if (controls !== null) {
                    controls.update(layer);
                }

                if (layers.length === 1) {
                    _zoomMap();
                } else {
                    _drawLayer(layer);
                }
            } else {
                throw new ObjectException("No Layer Object argument");
            }
            return self;
        }

        self.removeLayer = function(layer) {
            var index = layers.indexOf(layer);
            if (index !== -1) {
                layers.splice(index, 1);
                d3.selectAll('.'+layer.getID()).remove();

                if (controls !== null) {
                    controls.update(layer);
                }
            }
        }
        markers = [];
        self.addMarker = function(coords) {
            marker = new _MapMarker(coords, self, projection);
            marker.update();
            markers.push(marker);
            return self;
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