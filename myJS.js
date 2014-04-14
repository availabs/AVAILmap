window.onload = function(){
	var map = avl.Map('#map');
	map.addLayer(avl.TileLayer("http://tile.openstreetmap.us/vectiles-water-areas", {styles:['water']}));
	var roads = avl.TileLayer("http://localhost:8000/roads", {properties:['type']});
	map.addLayer(roads);
	map.addLayer(avl.TileLayer("http://tile.openstreetmap.us/vectiles-buildings", {styles:['building']}));
}