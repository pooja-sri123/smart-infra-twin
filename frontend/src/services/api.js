const API_BASE = "http://localhost:8000";

export async function fetchHealth() {
  const res = await fetch(`${API_BASE}/api/health`);
  return res.json();
}

export async function fetchZones() {
  const res = await fetch(`${API_BASE}/api/zones`);
  return res.json();
}

export async function fetchZoneHistory(zoneId, limit = 40) {
  const res = await fetch(`${API_BASE}/api/zones/${zoneId}/history?limit=${limit}`);
  return res.json();
}

export async function setSimulationScenario(scenario) {
  const res = await fetch(`${API_BASE}/api/simulate/scenario`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ scenario }),
  });
  return res.json();
}

export async function fetchAlerts(resolved = null) {
  const url = resolved !== null ? `${API_BASE}/api/alerts?resolved=${resolved}` : `${API_BASE}/api/alerts`;
  const res = await fetch(url);
  return res.json();
}

export async function resolveAlert(alertId) {
  const res = await fetch(`${API_BASE}/api/alerts/${alertId}/resolve`, {
    method: "POST",
  });
  return res.json();
}

export async function fetchMaterialPassport(zoneId) {
  const res = await fetch(`${API_BASE}/api/passport/${zoneId}`);
  return res.json();
}

export function createTelemetryWebSocket(onMessage, onStatusChange) {
  let ws = null;
  let reconnectTimeout = null;

  function connect() {
    const wsUrl = "ws://localhost:8000/ws/telemetry";
    ws = new WebSocket(wsUrl);

    ws.onopen = () => {
      if (onStatusChange) onStatusChange("connected");
    };

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (onMessage) onMessage(data);
      } catch (err) {
        console.error("WS Parse error", err);
      }
    };

    ws.onerror = () => {
      if (onStatusChange) onStatusChange("error");
    };

    ws.onclose = () => {
      if (onStatusChange) onStatusChange("disconnected");
      reconnectTimeout = setTimeout(connect, 3000);
    };
  }

  connect();

  return {
    send: (msg) => {
      if (ws && ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify(msg));
      }
    },
    close: () => {
      if (reconnectTimeout) clearTimeout(reconnectTimeout);
      if (ws) ws.close();
    }
  };
}
