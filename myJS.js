window.onload = function(){
	var map = avl.Map('#map');
	var roads = avl.TileLayer("http://localhost:8000/roads", {properties:['type']});
	map.addLayer(roads);
	map.addLayer(avl.TileLayer("http://tile.openstreetmap.us/vectiles-buildings"));
	map.addLayer(avl.TileLayer("http://tile.openstreetmap.us/vectiles-water-areas", {styles:['water']}));
}