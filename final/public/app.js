const htmlBtn = document.getElementById("htmlBtn");
const cssBtn = document.getElementById("cssBtn");
const jsBtn = document.getElementById("jsBtn");
const serverBtn = document.getElementById("serverBtn");
const dbBtn = document.getElementById("dbBtn");

const stage = document.getElementById("stage");
const explanation = document.getElementById("explanation");
const body = document.body;

let latestMTAData = [];
let latestFeed = "ACE";
let latestMode = "live";

function clearFlow() {
  document.querySelectorAll(".flow-node").forEach((node) => {
    node.classList.remove("active", "done");
  });
}

function setFlowStatus(step, text) {
  const statusText = document.getElementById("flowStatusText");
  if (statusText) {
    statusText.textContent = text;
  }

  const steps = ["node-client", "node-server", "node-mta", "node-browser"];
  let reachedCurrent = false;

  steps.forEach((id) => {
    const node = document.getElementById(id);
    if (!node) return;

    node.classList.remove("active");

    if (!reachedCurrent) {
      node.classList.add("done");
    }

    if (id === step) {
      node.classList.remove("done");
      node.classList.add("active");
      reachedCurrent = true;
    }

    if (reachedCurrent && id !== step) {
      node.classList.remove("done");
    }
  });
}

function renderResults(title, items, mode = "") {
  const resultBox = document.getElementById("resultBox");
  if (!resultBox) return;

  if (!items || items.length === 0) {
    resultBox.innerHTML = `<div class="card">No matching results found.</div>`;
    return;
  }

  resultBox.innerHTML = `
    <div class="route">${title}</div>
    ${mode ? `<div class="mode-badge">mode: ${mode}</div>` : ""}
    ${items.slice(0, 8).map((item) => `
      <div class="result-item">
        <div><strong>${item.route}</strong></div>
        <div>Stop: ${item.stopId}</div>
        <div>Arrival in ${item.etaMin} min</div>
      </div>
    `).join("")}
  `;
}

// 1. HTML
htmlBtn.addEventListener("click", () => {
  stage.innerHTML = `
    <h1>NYC Subway Anatomy</h1>
    <p>This project visualizes how a web application works.</p>

    <div class="card">
      <div class="label">INPUT</div>

      <select id="lineSelect">
        <option value="ACE">A / C / E</option>
        <option value="123456">1 / 2 / 3 / 4 / 5 / 6</option>
        <option value="NQRW">N / Q / R / W</option>
        <option value="BDFM">B / D / F / M</option>
        <option value="L">L Train</option>
        <option value="7">7 Train</option>
      </select>

      <button id="searchBtn">Filter Loaded Data</button>
    </div>

    <div id="flowViz" class="flow-wrap">
      <div class="flow">
        <div class="flow-node" id="node-client">Client</div>
        <div class="flow-node" id="node-server">Server</div>
        <div class="flow-node" id="node-mta">MTA API</div>
        <div class="flow-node" id="node-browser">Browser UI</div>
      </div>
      <div id="flowStatusText" class="flow-status-text">Waiting for interaction...</div>
    </div>

    <div class="card">
      <div class="label">OUTPUT</div>
      <div id="resultBox">No data yet.</div>
    </div>
  `;

  explanation.innerHTML = `
    <strong>HTML layer:</strong><br>
    HTML creates the structure of the interface: controls, flow diagram, and output area.
  `;

  cssBtn.disabled = false;
});

// 2. CSS
cssBtn.addEventListener("click", () => {
  body.classList.add("styled");

  explanation.innerHTML = `
    <strong>CSS layer:</strong><br>
    CSS changes hierarchy, spacing, contrast, and readability. The structure becomes an interface.
  `;

  jsBtn.disabled = false;
});

// 3. Client JS
jsBtn.addEventListener("click", () => {
  const searchBtn = document.getElementById("searchBtn");
  const lineSelect = document.getElementById("lineSelect");
  const resultBox = document.getElementById("resultBox");

  if (searchBtn) {
    searchBtn.addEventListener("click", () => {
      const selectedLine = lineSelect.value;

      if (!latestMTAData.length) {
        resultBox.innerHTML = `<div class="card">Please click "Fetch Live Data" first.</div>`;
        return;
      }

      const filtered = latestMTAData.filter((item) =>
        item.route.toUpperCase() === selectedLine ||
        selectedLine.includes(item.route.toUpperCase())
      );

      if (filtered.length === 0) {
        resultBox.innerHTML = `<div class="card">No matching live results found.</div>`;
        return;
      }

      renderResults("Filtered Live Data", filtered, latestMode);
    });
  }

  explanation.innerHTML = `
    <strong>Client-side JavaScript layer:</strong><br>
    JavaScript enables interaction, state, filtering, and dynamic updates without reloading the page.
  `;

  serverBtn.disabled = false;
});

// 4. Server
serverBtn.addEventListener("click", async () => {
  try {
    const lineSelect = document.getElementById("lineSelect");
    const selectedFeed = lineSelect ? lineSelect.value : "ACE";
    latestFeed = selectedFeed;

    setFlowStatus("node-client", "Client: preparing request...");

    await new Promise(resolve => setTimeout(resolve, 300));
    setFlowStatus("node-server", "Server: receiving request...");

    await new Promise(resolve => setTimeout(resolve, 500));
    setFlowStatus("node-mta", "MTA API: fetching realtime feed...");

    const res = await fetch(`/api/mta?feed=${selectedFeed}`);
    const data = await res.json();

    await new Promise(resolve => setTimeout(resolve, 400));
    setFlowStatus("node-server", "Server: parsing and filtering data...");

    const resultBox = document.getElementById("resultBox");

    if (resultBox) {
      if (data.success) {
        latestMTAData = data.arrivals;
        latestMode = data.mode || "live";

        renderResults(`MTA Data (${data.feed})`, latestMTAData, latestMode);
      } else {
        resultBox.innerHTML = `<div class="card">Failed to load MTA data.</div>`;
      }
    }

    await new Promise(resolve => setTimeout(resolve, 400));
    setFlowStatus("node-browser", "Browser UI: rendering results...");

    explanation.innerHTML = `
      <strong>Server layer:</strong><br>
      The browser sends a request to <code>server.js</code>. The server fetches realtime subway data from the MTA API, processes it, and returns simplified results to the interface.
    `;

    dbBtn.disabled = false;

    await new Promise(resolve => setTimeout(resolve, 500));
    const statusText = document.getElementById("flowStatusText");
    if (statusText) {
      statusText.textContent = "Done. Data returned to the interface.";
    }
  } catch (err) {
    console.error(err);
    const statusText = document.getElementById("flowStatusText");
    if (statusText) {
      statusText.textContent = "Error: failed during data flow.";
    }
  }
});

// 5. Database
dbBtn.addEventListener("click", async () => {
  const resultBox = document.getElementById("resultBox");

  try {
    const res = await fetch("/api/logs");
    const data = await res.json();

    if (resultBox) {
      if (data.success && data.logs.length > 0) {
        resultBox.innerHTML = `
          <div class="route">Recent Requests</div>
          <div class="mode-badge">database log</div>
          ${data.logs.map((log) => {
            const date = new Date(log.time);
            const timeString = date.toLocaleTimeString([], {
              hour: "2-digit",
              minute: "2-digit"
            });

            return `
              <div class="result-item">
                <div><strong>Feed:</strong> ${log.feed}</div>
                <div><strong>Mode:</strong> ${log.mode}</div>
                <div><strong>Results:</strong> ${log.count}</div>
                <div><strong>Time:</strong> ${timeString}</div>
              </div>
            `;
          }).join("")}
        `;
      } else {
        resultBox.innerHTML = `<div class="card">No request history yet.</div>`;
      }
    }

    explanation.innerHTML = `
      <strong>Database layer:</strong><br>
      The database stores request history over time. Each server call writes a log entry including the selected feed, response mode, result count, and timestamp.
    `;
  } catch (err) {
    console.error(err);
    if (resultBox) {
      resultBox.innerHTML = `<div class="card">Failed to load database logs.</div>`;
    }
  }
});