rng = ['#edf8fb', '#ccece6', '#99d8c9', '#66c2a4', '#41ae76', '#238b45', '#005824']

window.onload = function(){
	avl.Map('#map')
		.addLayer(avl.TileLayer("http://tile.openstreetmap.us/vectiles-buildings",
			{styles:['building'], name:'buildings'}))
		.addLayer(avl.TileLayer("http://tile.openstreetmap.us/vectiles-highroad",
			{styles:['road'], properties:['kind'], name:'roads'}))
		.addLayer(avl.TileLayer("http://tile.openstreetmap.us/vectiles-water-areas",
			{styles:['water'], hover:['name', 'water-hover']}))
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
	// 					{properties:['type'],
	// 					 choro: {attr: 'aadt', range: rng, style: 'stroke'}}));
}