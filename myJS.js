dmn = [5000, 200000];
rng = ["#a50026","#d73027","#f46d43","#fdae61","#fee08b","#d9ef8b","#a6d96a","#66bd63","#1a9850","#006837"];
rng = rng.reverse();

window.onload = function(){
	var map = avl.Map('#map')
		.addLayer(avl.TileLayer("http://tile.openstreetmap.us/vectiles-buildings",
			{styles:['building'], name:'buildings', dataType: 'topojson'}))
		.addLayer(avl.TileLayer("http://tile.openstreetmap.us/vectiles-highroad",
			{styles:['road'], properties:['kind'], name:'roads', dataType: 'topojson'}))
		.addLayer(avl.TileLayer("http://tile.openstreetmap.us/vectiles-water-areas",
			{styles:['water'], hover:[['water-hover', 'name']], dataType: 'topojson'}))
		// .addLayer(avl.TileLayer("http://tile.openstreetmap.us/vectiles-skeletron",
		// 	{styles:['road-names']}))
		.addControl('info', 'bottom-left')
		.addControl('zoom')
		.addControl('layer', 'top-left')
		.addMarker([-73.824, 42.686]);
	// map.addLayer(avl.TileLayer("http://tile.openstreetmap.us/vectiles-land-usages",
	// 					{styles:['land'], hover: true}));
	// map.addLayer(avl.TileLayer("http://localhost:8000/counties",
	// 					{styles:['county'], hover: 'county-hover', zIndex: -1}));
	// map.addLayer(avl.TileLayer("http://localhost:8000/roads",
	// 					{properties:['type'], dataType: 'topojson', name: 'HPMS', 
	// 					 choros: [{attr: 'aadt', domain: dmn, range: rng, style: 'stroke'}]}));
}