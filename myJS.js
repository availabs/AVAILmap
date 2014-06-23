dmn = [5000, 200000];
rng = ["#a50026","#d73027","#f46d43","#fdae61","#fee08b","#d9ef8b","#a6d96a","#66bd63","#1a9850","#006837"];
rng = rng.reverse();

window.onload = function(){
	var map = avl.Map('#map', {startScale: 7})
		.addLayer(avl.VectorLayer("http://{s}.tile.openstreetmap.us/vectiles-buildings/{z}/{x}/{y}.topojson",
			{styles:['building'], name:'Buildings', zIndex: 2}))
		.addControl('layer', 'top-left')
		.addLayer(avl.VectorLayer("http://{s}.tile.openstreetmap.us/vectiles-highroad/{z}/{x}/{y}.topojson",
			{styles:['road'], properties:['kind'], name:'Roads', zIndex: 1}))
		// .addLayer(avl.VectorLayer("http://{s}.tile.openstreetmap.us/vectiles-water-areas/{z}/{x}/{y}.topojson",
		// 	{styles:['water'], hover:[['water-hover', 'name']], zIndex: 0}))
		// .addLayer(avl.VectorLayer("http://{s}.tile.openstreetmap.us/vectiles-skeletron/{z}/{x}/{y}.topojson",
		// 	{styles:['road-names']}))
		.addControl('info', 'bottom-left')
		.addControl('zoom')
		.addMarker([-73.824, 42.686], {name: 'UAlbany'})
		.addMarker([-73.682446, 42.735232], {name: 'Troy'})
		.addMarker([-76.47492, 42.691599], {name: 'Locke'})
		.addControl('marker')
		.addLayer(avl.RasterLayer("http://{s}.tiles.mapbox.com/v3/am3081.map-lkbhqenw/{z}/{x}/{y}.png"));
	// map.addLayer(avl.VectorLayer("http://{s}.tile.openstreetmap.us/vectiles-land-usages/{z}/{x}/{y}.topojson",
	// 					{styles:['land'], hover: true}));
	// map.addLayer(avl.VectorLayer("http://localhost:8000/counties",
	// 					{styles:['county'], hover: 'county-hover', zIndex: -1}));
	// map.addLayer(avl.VectorLayer("http://localhost:8000/roads",
	// 					{properties:['type'], dataType: 'topojson', name: 'HPMS', 
	// 					 choros: [{attr: 'aadt', domain: dmn, range: rng, style: 'stroke'}]}));
}