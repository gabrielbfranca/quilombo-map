// Initialize the map
var map = L.map("map").setView([-15.78, -47.93], 5); // Center Brazil

// Add base map tiles
L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
  attribution: "&copy; OpenStreetMap contributors",
}).addTo(map);

var data = [
  {
    Name: "Escola Quilombo 1",
    Latitude: -15.82,
    Longitude: -47.95,
    Address: "Rua A, Cidade X",
    Description: "Descrição da escola 1",
  },
  {
    Name: "Escola Quilombo 2",
    Latitude: -16.0,
    Longitude: -48.05,
    Address: "Rua B, Cidade Y",
    Description: "Descrição da escola 2",
  },
];

// Add markers with popups (cards)
data.forEach(function (item) {
  var marker = L.marker([item.Latitude, item.Longitude]).addTo(map);
  marker.bindPopup(
    "<b>" + item.Name + "</b><br>" + item.Address + "<br>" + item.Description
  );
});

// Add search control
L.Control.geocoder().addTo(map);
