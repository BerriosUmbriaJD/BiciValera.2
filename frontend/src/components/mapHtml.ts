import { Palette } from "@/src/theme";

type Station = { id: string; name: string; lat: number; lon: number; available: number };
type UserLoc = { lat: number; lon: number } | null;

export function buildMapHtml(stations: Station[], c: Palette, userLoc: UserLoc, isDark: boolean) {
  const stationsJson = JSON.stringify(stations);
  const userJson = JSON.stringify(userLoc);
  const tileUrl = isDark
    ? "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}.png"
    : "https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}.png";
  return `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
<link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
<script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
<style>
  html, body, #map { height: 100%; margin: 0; padding: 0; background: ${c.mapBg}; }
  .pin {
    width: 40px; height: 40px; border-radius: 50%; background: ${c.brandPrimary};
    border: 2.5px solid #fff; box-shadow: 0 4px 12px rgba(11,31,18,0.4);
    display: flex; align-items: center; justify-content: center; color: #fff;
    font-family: -apple-system, system-ui, sans-serif; font-weight: 800; font-size: 15px; position: relative;
  }
  .pin svg { width: 20px; height: 20px; }
  .pin .badge {
    position: absolute; top: -6px; right: -6px; background: ${c.warning}; color: #fff;
    min-width: 19px; height: 19px; border-radius: 10px; border: 2px solid #fff;
    font-size: 10px; display: flex; align-items: center; justify-content: center; padding: 0 3px; font-weight: 800;
  }
  .bike { filter: drop-shadow(0 2px 3px rgba(0,0,0,0.4)); }
  .userdot {
    width: 18px; height: 18px; border-radius: 50%; background: #2563EB; border: 3px solid #fff;
    box-shadow: 0 0 0 6px rgba(37,99,235,0.25); }
  .leaflet-control-attribution { font-size: 7px; opacity: 0.6; }
  .leaflet-bar a { display: none; }
</style>
</head>
<body>
<div id="map"></div>
<script>
  var stations = ${stationsJson};
  var userLoc = ${userJson};

  function send(obj) {
    var s = JSON.stringify(obj);
    if (window.ReactNativeWebView) { window.ReactNativeWebView.postMessage(s); }
    else if (window.parent) { window.parent.postMessage(s, '*'); }
  }

  var BIKE_SVG = '<svg viewBox="0 0 24 24" fill="#fff"><path d="M5 20a3.5 3.5 0 100-7 3.5 3.5 0 000 7zm14 0a3.5 3.5 0 100-7 3.5 3.5 0 000 7zM12 6l2 4h-4l-1.2 2.4M9 6h3"/><circle cx="5" cy="16.5" r="2.5" fill="none" stroke="#fff" stroke-width="1.6"/><circle cx="19" cy="16.5" r="2.5" fill="none" stroke="#fff" stroke-width="1.6"/></svg>';

  var map = L.map('map', { zoomControl: false, attributionControl: true })
    .setView([9.3175, -70.6015], 14);
  L.tileLayer('${tileUrl}', { maxZoom: 20, subdomains: 'abcd', attribution: '© OSM · CARTO' }).addTo(map);

  stations.forEach(function(s) {
    var html = '<div class="pin">' + BIKE_SVG + '<div class="badge">' + s.available + '</div></div>';
    var icon = L.divIcon({ html: html, className: '', iconSize: [40,40], iconAnchor: [20,20] });
    var m = L.marker([s.lat, s.lon], { icon: icon }).addTo(map);
    m.on('click', function() { send({ type: 'select', id: s.id }); });
  });

  // User location + nearest station
  function haversine(aLat, aLon, bLat, bLon) {
    var R = 6371, dLat = (bLat-aLat)*Math.PI/180, dLon = (bLon-aLon)*Math.PI/180;
    var x = Math.sin(dLat/2)*Math.sin(dLat/2) + Math.cos(aLat*Math.PI/180)*Math.cos(bLat*Math.PI/180)*Math.sin(dLon/2)*Math.sin(dLon/2);
    return R*2*Math.asin(Math.sqrt(x));
  }
  if (userLoc) {
    var uicon = L.divIcon({ html: '<div class="userdot"></div>', className: '', iconSize: [18,18], iconAnchor: [9,9] });
    L.marker([userLoc.lat, userLoc.lon], { icon: uicon, zIndexOffset: 1000 }).addTo(map);
    map.setView([userLoc.lat, userLoc.lon], 14);
    var best = null, bestD = 1e9;
    stations.forEach(function(s) {
      var d = haversine(userLoc.lat, userLoc.lon, s.lat, s.lon);
      if (d < bestD) { bestD = d; best = s; }
    });
    if (best) send({ type: 'nearest', id: best.id, name: best.name, distance: Math.round(bestD*1000) });
  }

  // Real street routes + coherent bike movement along them
  var routes = [];
  function animateBike(coords, type) {
    if (!coords || coords.length < 2) return;
    var color = type === 'electric' ? '${c.info}' : '${c.brandSecondary}';
    var icon = L.divIcon({
      html: '<div class="bike"><svg viewBox="0 0 24 24" width="26" height="26" fill="'+color+'"><circle cx="12" cy="12" r="11" fill="'+color+'"/><path d="M7 16.5a2.2 2.2 0 100-4.4 2.2 2.2 0 000 4.4zm10 0a2.2 2.2 0 100-4.4 2.2 2.2 0 000 4.4z" fill="#fff"/><path d="M13 8.5l1.6 3H11l-.9 1.8M11 8.5h2.2" stroke="#fff" stroke-width="1.1" fill="none"/></svg></div>',
      className: '', iconSize: [26,26], iconAnchor: [13,13]
    });
    var marker = L.marker(coords[0], { icon: icon, zIndexOffset: 500 }).addTo(map);
    var i = 0, dir = 1;
    setInterval(function() {
      i += dir;
      if (i >= coords.length - 1) { i = coords.length - 1; dir = -1; }
      else if (i <= 0) { i = 0; dir = 1; }
      marker.setLatLng(coords[i]);
    }, 220);
  }

  function drawRoutes() {
    for (var k = 0; k < stations.length - 1; k++) {
      (function(a, b, idx) {
        var url = 'https://router.project-osrm.org/route/v1/driving/' +
          a.lon + ',' + a.lat + ';' + b.lon + ',' + b.lat + '?overview=full&geometries=geojson';
        fetch(url).then(function(r){ return r.json(); }).then(function(data){
          var coords;
          if (data.routes && data.routes[0]) {
            coords = data.routes[0].geometry.coordinates.map(function(cc){ return [cc[1], cc[0]]; });
          } else {
            coords = [[a.lat,a.lon],[b.lat,b.lon]];
          }
          L.polyline(coords, { color: '${c.brandPrimary}', weight: 5, opacity: 0.65 }).addTo(map);
          L.polyline(coords, { color: '${c.success}', weight: 2, opacity: 0.9, dashArray: '1 10' }).addTo(map);
          animateBike(coords, idx % 2 === 0 ? 'electric' : 'mechanical');
        }).catch(function(){
          var coords = [[a.lat,a.lon],[b.lat,b.lon]];
          L.polyline(coords, { color: '${c.brandPrimary}', weight: 3, opacity: 0.5, dashArray: '6' }).addTo(map);
          animateBike(coords, idx % 2 === 0 ? 'electric' : 'mechanical');
        });
      })(stations[k], stations[k+1], k);
    }
  }
  drawRoutes();

  window._recenter = function() { if (userLoc) { map.setView([userLoc.lat, userLoc.lon], 15); } };
  window.addEventListener('message', function(e) {
    try {
      var d = JSON.parse(e.data);
      if (d && d.type === 'recenter' && userLoc) { map.setView([userLoc.lat, userLoc.lon], 15); }
    } catch (err) {}
  });
</script>
</body>
</html>`;
}
