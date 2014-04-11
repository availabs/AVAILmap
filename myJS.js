window.onload = function(){
	var map = avl.Map('#map');
	map.addLayer(avl.TileLayer("http://localhost:8000/roads"));
	map.addLayer(avl.TileLayer("http://tile.openstreetmap.us/vectiles-buildings"));
	map.addLayer(avl.TileLayer("http://tile.openstreetmap.us/vectiles-water-areas"));
}