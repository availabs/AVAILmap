window.onload = function(){
	var map = avl.Map({minZoom: 4})
		.addControl('layer', 'top-left')
		.addLayer(avl.VectorLayer("http://{s}.tile.openstreetmap.us/vectiles-highroad/{z}/{x}/{y}.topojson",
			{styles:['road'], properties:['kind'], name:'Roads', zIndex: 1}))
		.addControl('zoom')
		.addMarker(avl.MapMarker([-73.824, 42.686], {name: 'UAlbany'}))
		.addControl('marker')
		.addMarker(avl.MapMarker([-76.47492, 42.691599], {name: 'Locke', minZoom: 5}))
		.addLayer(avl.RasterLayer("http://{s}.tiles.mapbox.com/v3/am3081.map-lkbhqenw/{z}/{x}/{y}.png"));

	var layer = avl.VectorLayer("http://{s}.tile.openstreetmap.us/vectiles-buildings/{z}/{x}/{y}.topojson",
			{styles:['building'], name:'Buildings', zIndex: 2})
	map.addLayer(layer);

	var custom = map.customControl({name: 'Click me!', position: 'bottom-left', click: _clicked});

	map.addControl('info', 'bottom-left');
	
	var marker = avl.MapMarker([-73.682446, 42.735232],
					{name: 'Troy', drag: true, click: _clickedMarker, BGcolor: "#a50026"})
			.addTo(map);

	var BGcolors = ["#a50026","#d73027","#f46d43","#fdae61","#fee090","#ffffbf","#e0f3f8","#abd9e9","#74add1","#4575b4","#313695"];

	function _clicked(control) {
		alert("Thanks for clicking!!!");
	}
	function _clickedMarker(m) {
		marker.BGcolor(BGcolors[Math.floor(Math.random()*BGcolors.length)]);
	}
}