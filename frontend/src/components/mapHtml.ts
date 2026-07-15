import { colors } from "@/src/theme";

type Station = { id: string; name: string; lat: number; lon: number; available: number };
type MovingBike = { id: string; type: string; lat: number; lon: number };

export function buildMapHtml(stations: Station[], moving: MovingBike[]) {
  const stationsJson = JSON.stringify(stations);
  const movingJson = JSON.stringify(moving);
  return `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
<link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
<script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
<style>
  html, body, #map { height: 100%; margin: 0; padding: 0; background: #DCE7DE; }
  .pin {
    width: 38px; height: 38px; border-radius: 50%; background: ${colors.brandPrimary};
    border: 2px solid #fff; box-shadow: 0 4px 10px rgba(11,31,18,0.35);
    display: flex; align-items: center; justify-content: center; color: #fff;
    font-family: -apple-system, system-ui, sans-serif; font-weight: 800; font-size: 13px; position: relative;
  }
  .pin .badge {
    position: absolute; top: -6px; right: -6px; background: ${colors.warning}; color: #fff;
    min-width: 18px; height: 18px; border-radius: 9px; border: 1.5px solid #fff;
    font-size: 10px; display: flex; align-items: center; justify-content: center; padding: 0 3px;
  }
  .leaflet-control-attribution { font-size: 8px; }
</style>
</head>
<body>
<div id="map"></div>
<script>
  var stations = ${stationsJson};
  var moving = ${movingJson};

  function send(obj) {
    var s = JSON.stringify(obj);
    if (window.ReactNativeWebView) { window.ReactNativeWebView.postMessage(s); }
    else if (window.parent) { window.parent.postMessage(s, '*'); }
  }

  var map = L.map('map', { zoomControl: false, attributionControl: true })
    .setView([9.3175, -70.6015], 14);
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 19, attribution: '© OpenStreetMap'
  }).addTo(map);

  stations.forEach(function(s) {
    var html = '<div class="pin">B<div class="badge">' + s.available + '</div></div>';
    var icon = L.divIcon({ html: html, className: '', iconSize: [38,38], iconAnchor: [19,19] });
    var m = L.marker([s.lat, s.lon], { icon: icon }).addTo(map);
    m.on('click', function() { send({ type: 'select', id: s.id }); });
  });

  function drawRoutes() {
    for (var i = 0; i < stations.length - 1; i++) {
      (function(a, b) {
        var url = 'https://router.project-osrm.org/route/v1/driving/' +
          a.lon + ',' + a.lat + ';' + b.lon + ',' + b.lat + '?overview=full&geometries=geojson';
        fetch(url).then(function(r){ return r.json(); }).then(function(data){
          if (data.routes && data.routes[0]) {
            var coords = data.routes[0].geometry.coordinates.map(function(c){ return [c[1], c[0]]; });
            L.polyline(coords, { color: '${colors.brandPrimary}', weight: 5, opacity: 0.75 }).addTo(map);
            L.polyline(coords, { color: '${colors.success}', weight: 2, opacity: 0.9, dashArray: '1 10' }).addTo(map);
          } else {
            L.polyline([[a.lat,a.lon],[b.lat,b.lon]], { color: '${colors.brandPrimary}', weight: 3, opacity: 0.5, dashArray: '6' }).addTo(map);
          }
        }).catch(function(){
          L.polyline([[a.lat,a.lon],[b.lat,b.lon]], { color: '${colors.brandPrimary}', weight: 3, opacity: 0.5, dashArray: '6' }).addTo(map);
        });
      })(stations[i], stations[i+1]);
    }
  }
  drawRoutes();

  var bikeLayer = L.layerGroup().addTo(map);
  function renderBikes(list) {
    bikeLayer.clearLayers();
    (list || []).forEach(function(b) {
      L.circleMarker([b.lat, b.lon], {
        radius: 6, color: '#fff', weight: 2,
        fillColor: b.type === 'electric' ? '${colors.info}' : '${colors.brandSecondary}',
        fillOpacity: 1
      }).addTo(bikeLayer);
    });
  }
  renderBikes(moving);
  window.updateBikes = function(list) { renderBikes(list); };

  window.addEventListener('message', function(e) {
    try {
      var d = JSON.parse(e.data);
      if (d && d.type === 'bikes') { renderBikes(d.list); }
    } catch (err) {}
  });
</script>
</body>
</html>`;
}
