rng = ['#edf8fb', '#ccece6', '#99d8c9', '#66c2a4', '#41ae76', '#238b45', '#005824']

window.onload = function(){
	var map = avl.Map('#map');
	map.addLayer(avl.TileLayer("http://tile.openstreetmap.us/vectiles-buildings",
						{styles:['building'], hover: 'building-hover'}));
	map.addLayer(avl.TileLayer("http://tile.openstreetmap.us/vectiles-highroad",
	 					{styles:['road']}));
	map.addLayer(avl.TileLayer("http://tile.openstreetmap.us/vectiles-water-areas",
	 					{styles:['water']}));
	// map.addLayer(avl.TileLayer("http://tile.openstreetmap.us/vectiles-land-usages",
	// 					{styles:['land'], hover: true}));
	// map.addLayer(avl.TileLayer("http://localhost:8000/counties",
	// 					{styles:['county'], hover: 'county-hover', zIndex: -1}));
	// map.addLayer(avl.TileLayer("http://localhost:8000/roads",
	// 					{properties:['type'],
	// 					 choro: {attr: 'aadt', range: rng, style: 'stroke'}}));
}