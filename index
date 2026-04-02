<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Guide des Procédures Collectives — Livre VI C. com.</title>
  <link rel="icon" href="data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><text y='.9em' font-size='90'>⚖️</text></svg>">
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: system-ui, sans-serif; }
    #root { min-height: 100vh; }
    .api-status { position: fixed; bottom: 16px; right: 16px; padding: 6px 14px; border-radius: 20px; font-size: 11px; font-family: 'DM Sans', sans-serif; z-index: 999; cursor: pointer; border: 1px solid #DDD9D0; background: #FAF9F6; color: #8A857C; }
    .api-status.connected { background: #E8F4EE; color: #2D7A5F; border-color: #B8E0CC; }
  </style>
</head>
<body>
  <div id="root"><p style="text-align:center;padding:40px;color:#999">Chargement...</p></div>
  <div id="api-status" class="api-status" onclick="checkApi()" title="Cliquez pour vérifier la connexion API">Mode hors-ligne</div>

  <script src="https://cdnjs.cloudflare.com/ajax/libs/react/18.3.1/umd/react.production.min.js"></script>
  <script src="https://cdnjs.cloudflare.com/ajax/libs/react-dom/18.3.1/umd/react-dom.production.min.js"></script>
  <script src="https://cdnjs.cloudflare.com/ajax/libs/babel-standalone/7.26.4/babel.min.js"></script>

  <script>
    var apiAvailable = false;
    async function checkApi() {
      var el = document.getElementById('api-status');
      try {
        var r = await fetch('/api/health', { signal: AbortSignal.timeout(3000) });
        var d = await r.json();
        if (d.status === 'ok') { apiAvailable = true; el.className = 'api-status connected'; el.textContent = 'API Légifrance connectée ✓'; }
        else throw new Error();
      } catch(e) { apiAvailable = false; el.className = 'api-status'; el.textContent = 'Mode hors-ligne (données figées)'; }
    }
    checkApi();
  </script>

  <script src="data.js"></script>
  <script>
    fetch('app.js').then(function(r){return r.text()}).then(function(code){
      var t = Babel.transform(code, {presets:['react']}).code;
      var s = document.createElement('script');
      s.textContent = t;
      document.body.appendChild(s);
    }).catch(function(e){ document.getElementById('root').innerHTML = '<p style="padding:40px;color:red">Erreur de chargement: ' + e.message + '</p>'; });
  </script>
</body>
</html>
