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
    display: flex; align-items: center; justify-content: center; color: #fff; position: relative;
    transition: transform 0.25s ease;
  }
  .pin svg { width: 20px; height: 20px; }
  .pin .badge {
    position: absolute; top: -6px; right: -6px; background: ${c.warning}; color: #fff;
    min-width: 19px; height: 19px; border-radius: 10px; border: 2px solid #fff;
    font-size: 10px; display: flex; align-items: center; justify-content: center; padding: 0 3px; font-weight: 800;
    font-family: -apple-system, system-ui, sans-serif;
  }
  .pin.bump { transform: scale(1.25); }
  .bike svg { filter: drop-shadow(0 2px 3px rgba(0,0,0,0.45)); }
  .userdot { width: 18px; height: 18px; border-radius: 50%; background: #2563EB; border: 3px solid #fff; box-shadow: 0 0 0 6px rgba(37,99,235,0.25); }
  .leaflet-control-attribution { font-size: 7px; opacity: 0.6; }
</style>
</head>
<body>
<div id="map"></div>
<script>
  var initialStations = ${stationsJson};
  var userLoc = ${userJson};

  function send(obj) {
    var s = JSON.stringify(obj);
    if (window.ReactNativeWebView) { window.ReactNativeWebView.postMessage(s); }
    else if (window.parent) { window.parent.postMessage(s, '*'); }
  }

  var BIKE_SVG = '<svg viewBox="0 0 24 24" fill="#fff"><path d="M12 6l2 4h-4l-1.2 2.4M9 6h3"/><circle cx="5" cy="16.5" r="3" fill="none" stroke="#fff" stroke-width="1.8"/><circle cx="19" cy="16.5" r="3" fill="none" stroke="#fff" stroke-width="1.8"/></svg>';

  var map = L.map('map', { zoomControl: false, attributionControl: true }).setView([9.3175, -70.6015], 14);
  L.tileLayer('${tileUrl}', { maxZoom: 20, subdomains: 'abcd', attribution: '© OSM · CARTO' }).addTo(map);

  function pinIcon(available) {
    return L.divIcon({
      html: '<div class="pin">' + BIKE_SVG + '<div class="badge">' + available + '</div></div>',
      className: '', iconSize: [40,40], iconAnchor: [20,20]
    });
  }

  var stationMarkers = {}; // id -> { marker, available }
  initialStations.forEach(function(s) {
    var m = L.marker([s.lat, s.lon], { icon: pinIcon(s.available) }).addTo(map);
    m.on('click', function() { send({ type: 'select', id: s.id }); });
    stationMarkers[s.id] = { marker: m, available: s.available };
  });

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
    initialStations.forEach(function(s) { var d = haversine(userLoc.lat, userLoc.lon, s.lat, s.lon); if (d < bestD) { bestD = d; best = s; } });
    if (best) send({ type: 'nearest', id: best.id, name: best.name, distance: Math.round(bestD*1000) });
  }

  // ---- Live bike movement over real streets ----
  var routeCache = {}; // fromId_toId -> coords[]
  var bikes = {};      // id -> { marker, line, coords, cur }

  function bikeIcon(type) {
    var color = type === 'electric' ? '${c.info}' : '${c.brandSecondary}';
    return L.divIcon({
      html: '<div class="bike"><svg viewBox="0 0 24 24" width="24" height="24"><circle cx="12" cy="12" r="11" fill="'+color+'" stroke="#fff" stroke-width="1.5"/><path d="M7 15.5a1.8 1.8 0 100-3.6 1.8 1.8 0 000 3.6zm10 0a1.8 1.8 0 100-3.6 1.8 1.8 0 000 3.6z" fill="#fff"/><path d="M13 9l1.3 3H11l-.8 1.6M11 9h1.8" stroke="#fff" stroke-width="1" fill="none"/></svg></div>',
      className: '', iconSize: [24,24], iconAnchor: [12,12]
    });
  }

  function pointAt(coords, progress) {
    if (!coords || coords.length === 0) return null;
    if (coords.length === 1) return coords[0];
    var f = progress * (coords.length - 1);
    var i = Math.floor(f); var frac = f - i;
    var a = coords[i]; var b = coords[Math.min(i+1, coords.length-1)];
    return [a[0] + (b[0]-a[0])*frac, a[1] + (b[1]-a[1])*frac];
  }

  function tween(obj, target) {
    if (obj._anim) clearInterval(obj._anim);
    var start = obj.cur || target;
    var steps = 24, step = 0;
    obj._anim = setInterval(function() {
      step++;
      var t = step / steps;
      var lat = start[0] + (target[0]-start[0]) * t;
      var lon = start[1] + (target[1]-start[1]) * t;
      obj.marker.setLatLng([lat, lon]);
      obj.cur = [lat, lon];
      if (step >= steps) { clearInterval(obj._anim); obj._anim = null; obj.cur = target; }
    }, 110);
  }

  function ensureRoute(b, cb) {
    var key = b.from_id + '_' + b.to_id;
    if (routeCache[key]) { cb(routeCache[key]); return; }
    var url = 'https://router.project-osrm.org/route/v1/driving/' +
      b.from.lon + ',' + b.from.lat + ';' + b.to.lon + ',' + b.to.lat + '?overview=full&geometries=geojson';
    fetch(url).then(function(r){ return r.json(); }).then(function(data){
      var coords;
      if (data.routes && data.routes[0]) coords = data.routes[0].geometry.coordinates.map(function(cc){ return [cc[1], cc[0]]; });
      else coords = [[b.from.lat,b.from.lon],[b.to.lat,b.to.lon]];
      routeCache[key] = coords; cb(coords);
    }).catch(function(){
      var coords = [[b.from.lat,b.from.lon],[b.to.lat,b.to.lon]];
      routeCache[key] = coords; cb(coords);
    });
  }

  function createBike(b) {
    bikes[b.id] = { pending: true };
    ensureRoute(b, function(coords) {
      if (!bikes[b.id]) return;
      var pos = pointAt(coords, b.progress);
      var line = L.polyline(coords, { color: '${c.brandSecondary}', weight: 3, opacity: 0.35 }).addTo(map);
      var marker = L.marker(pos, { icon: bikeIcon(b.type), zIndexOffset: 600 }).addTo(map);
      bikes[b.id] = { marker: marker, line: line, coords: coords, cur: pos };
    });
  }

  function moveBike(b) {
    var obj = bikes[b.id];
    if (!obj || obj.pending || !obj.coords) return;
    var target = pointAt(obj.coords, b.progress);
    if (target) tween(obj, target);
  }

  function removeBike(id) {
    var obj = bikes[id];
    if (!obj) return;
    if (obj._anim) clearInterval(obj._anim);
    if (obj.marker) map.removeLayer(obj.marker);
    if (obj.line) map.removeLayer(obj.line);
    delete bikes[id];
  }

  function updateStations(list) {
    (list || []).forEach(function(s) {
      var sm = stationMarkers[s.id];
      if (!sm) return;
      if (sm.available !== s.available) {
        sm.available = s.available;
        sm.marker.setIcon(pinIcon(s.available));
        var el = sm.marker.getElement && sm.marker.getElement();
        if (el) { var pin = el.querySelector('.pin'); if (pin) { pin.classList.add('bump'); setTimeout(function(){ pin.classList.remove('bump'); }, 260); } }
      }
    });
  }

  function updateBikes(list) {
    var ids = {};
    (list || []).forEach(function(b) { ids[b.id] = true; });
    Object.keys(bikes).forEach(function(id) { if (!ids[id]) removeBike(id); });
    (list || []).forEach(function(b) {
      if (!bikes[b.id]) createBike(b);
      else moveBike(b);
    });
  }

  window.__applyUpdate = function(payload) {
    if (!payload) return;
    updateStations(payload.stations);
    updateBikes(payload.bikes);
  };
  window._recenter = function() { if (userLoc) { map.setView([userLoc.lat, userLoc.lon], 15); } };

  window.addEventListener('message', function(e) {
    try {
      var d = JSON.parse(e.data);
      if (d && d.type === 'update') { window.__applyUpdate(d.payload); }
      else if (d && d.type === 'recenter' && userLoc) { map.setView([userLoc.lat, userLoc.lon], 15); }
    } catch (err) {}
  });
</script>
</body>
</html>`;
}
