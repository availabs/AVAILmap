rng = ['#edf8fb', '#ccece6', '#99d8c9', '#66c2a4', '#41ae76', '#238b45', '#005824']

window.onload = function(){
	avl.Map('#map')
		.addLayer(avl.TileLayer("http://tile.openstreetmap.us/vectiles-buildings",
			{styles:['building'], name:'buildings'}))
		.addLayer(avl.TileLayer("http://tile.openstreetmap.us/vectiles-highroad",
			{styles:['road'], name:'roads'}))
		.addLayer(avl.TileLayer("http://tile.openstreetmap.us/vectiles-water-areas",
			{styles:['water']}))
		.addControl('info', 'bottom-left')
		.addControl('zoom')
		.addControl('layer', 'top-left');
	// map.addLayer(avl.TileLayer("http://tile.openstreetmap.us/vectiles-land-usages",
	// 					{styles:['land'], hover: true}));
	// map.addLayer(avl.TileLayer("http://localhost:8000/counties",
	// 					{styles:['county'], hover: 'county-hover', zIndex: -1}));
	// map.addLayer(avl.TileLayer("http://localhost:8000/roads",
	// 					{properties:['type'],
	// 					 choro: {attr: 'aadt', range: rng, style: 'stroke'}}));
}