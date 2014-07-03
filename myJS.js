window.onload = function(){
	var map = avl.Map({startScale: 3})
		.addLayer(avl.VectorLayer("http://{s}.tile.openstreetmap.us/vectiles-buildings/{z}/{x}/{y}.topojson",
			{styles:['building'], name:'Buildings', zIndex: 2}))
		.addControl('layer', 'top-left')
		.addLayer(avl.VectorLayer("http://{s}.tile.openstreetmap.us/vectiles-highroad/{z}/{x}/{y}.topojson",
			{styles:['road'], properties:['kind'], name:'Roads', zIndex: 1}))

		// .addLayer(avl.VectorLayer("http://{s}.tile.openstreetmap.us/vectiles-skeletron/{z}/{x}/{y}.topojson",
		// 	{styles:['road-names']}))

		.addControl('info', 'bottom-left')
		.addControl('zoom')
		.addMarker(avl.MapMarker([-73.824, 42.686], {name: 'UAlbany', minZoom: 4}))
		.addControl('marker')
		.addMarker(avl.MapMarker([-76.47492, 42.691599], {name: 'Locke'}))
		.addLayer(avl.RasterLayer("http://{s}.tiles.mapbox.com/v3/am3081.map-lkbhqenw/{z}/{x}/{y}.png"));

	// var layer = avl.VectorLayer("http://localhost:8080/{z}/{x}/{y}", {dataType: 'geojson'});

	// map.addLayer(layer);	
	
	var marker = avl.MapMarker([-73.682446, 42.735232], {name: 'Troy', drag: true});
	marker.addTo(map);
}