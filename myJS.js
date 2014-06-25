dmn = [5000, 200000];
rng = ["#a50026","#d73027","#f46d43","#fdae61","#fee08b","#d9ef8b","#a6d96a","#66bd63","#1a9850","#006837"];
rng = rng.reverse();

window.onload = function(){
	var map = avl.Map({startScale: 3})
		.addLayer(avl.VectorLayer("http://{s}.tile.openstreetmap.us/vectiles-buildings/{z}/{x}/{y}.topojson",
			{styles:['building'], name:'Buildings', zIndex: 2}))
		.addControl('layer', 'top-left')
		// .addLayer(avl.VectorLayer("http://{s}.tile.openstreetmap.us/vectiles-highroad/{z}/{x}/{y}.topojson",
		// 	{styles:['road'], properties:['kind'], name:'Roads', zIndex: 1}))

		// .addLayer(avl.VectorLayer("http://{s}.tile.openstreetmap.us/vectiles-water-areas/{z}/{x}/{y}.topojson",
		// 	{styles:['water'], hover:[['water-hover', 'name']], zIndex: 0}))
		// .addLayer(avl.VectorLayer("http://{s}.tile.openstreetmap.us/vectiles-skeletron/{z}/{x}/{y}.topojson",
		// 	{styles:['road-names']}))

		.addControl('info', 'bottom-left')
		.addControl('zoom')
		.addMarker(avl.MapMarker([-73.824, 42.686], {name: 'UAlbany', minZoom: 4}))
		.addControl('marker')
		.addMarker(avl.MapMarker([-76.47492, 42.691599], {name: 'Locke'}))

		.addLayer(avl.RasterLayer("http://{s}.tiles.mapbox.com/v3/am3081.map-lkbhqenw/{z}/{x}/{y}.png"));

	map.addLayer(avl.VectorLayer("http://localhost:8000/roads/{z}/{x}/{y}.topojson",
		{properties:['type'], name: 'HPMS',
		 choros: [{attr: 'aadt', domain: dmn, range: rng, style: 'stroke'}]}));

	map.addLayer(avl.VectorLayer("http://localhost:8000/states/{z}/{x}/{y}.topojson",
		{styles:['state'], name: 'States', func: _draw}));
	
	var marker = avl.MapMarker([-73.682446, 42.735232], {name: 'Troy', drag: true});
	marker.addTo(map);

	var JSON_ = {};

	function _draw(SVG, tile, tilePath, layer, json) {
	    var k = (1 << tile[2]) * 256;

	    if (!(k in JSON_)) {
	    	JSON_[k] = {};
	    }

	    var pathLayerID = layer.id();

	    tilePath.projection()
	        .translate([k / 2 - tile[0] * 256, k / 2 - tile[1] * 256])
	        .scale(k / 2 / Math.PI);

	    var visibility = layer.getVisibility();

	    var paths = SVG.selectAll('.'+pathLayerID)
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
	        .style('visibility', visibility)
	        .each(function(d) {
	            var path = d3.select(this),
	            	tag = d.properties.name.replace(/\s/, '');

	            d.properties.tag = tag;

	        	if (!(tag in JSON_[k])) {
	        		JSON_[k][tag] = {
	        			type: 'Feature',
	        			geometry: {
	        				coordinates: [],
	        				type: d.geometry.type
	        			},
	        			IDs: []
	        		};
	        	}
	        	var id = tile.join('-');
	        	if (JSON_[k][tag].IDs.indexOf(id) == -1) {
	        		JSON_[k][tag].IDs.push(id)
	        		JSON_[k][tag].geometry.coordinates = JSON_[k][tag].geometry.coordinates.concat(d.geometry.coordinates);
	        	}

	            path.classed(tag, true)
	                .on('mouseover', function() {
	                    d3.selectAll('.'+tag).classed('state-hover', true);
	                })
	                .on('mouseout', function() {
	                    d3.selectAll('.'+tag).classed('state-hover', false);
	                });
	        })
	        .on('click', function(d) {

				var projection = map.projection(),
					path = d3.geo.path().projection(projection);

	        	console.log(JSON_, d.properties.tag, JSON_[k][d.properties.tag])
	        	console.log(path.bounds(JSON_[k][d.properties.tag]))
	        });
	}

}