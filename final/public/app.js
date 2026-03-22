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

function clearFlow() {
  document.querySelectorAll(".flow-node").forEach((node) => {
    node.classList.remove("active", "done");
  });
}

function setFlowStatus(step, text) {
  const statusText = document.getElementById("flowStatusText");
  if (statusText) statusText.textContent = text;

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
  });
}

// HTML
htmlBtn.addEventListener("click", () => {
  stage.innerHTML = `
    <div class="flow-wrap">
      <div class="flow">
        <div id="node-client" class="flow-node">User</div>
        <div class="flow-arrow">→</div>
        <div id="node-server" class="flow-node">Node.js</div>
        <div class="flow-arrow">→</div>
        <div id="node-mta" class="flow-node">MTA</div>
        <div class="flow-arrow">→</div>
        <div id="node-browser" class="flow-node">UI</div>
      </div>
      <div id="flowStatusText" style="font-size:12px; margin-top:10px; opacity:0.8;">
        System Ready
      </div>
    </div>

    <div class="card">
      <div class="label">Select Subway Line Group:</div>
      <select id="feedSelect">
        <option value="ACE">A, C, E Lines</option>
        <option value="123456">1, 2, 3, 4, 5, 6 Lines</option>
        <option value="NQRW">N, Q, R, W Lines</option>
        <option value="BDFM">B, D, F, M Lines</option>
        <option value="L">L Line</option>
        <option value="7">7 Line</option>
      </select>

      <div id="resultBox" style="margin-top:20px;">
        <div style="opacity:0.5; font-style:italic;">Data will appear here...</div>
      </div>
    </div>
  `;

  explanation.innerHTML =
    "<strong>HTML Layer:</strong> The structural foundation is laid. Nodes are defined, but they have no style or logic yet.";

  cssBtn.disabled = false;
});

// CSS
cssBtn.addEventListener("click", () => {
  body.classList.add("styled");

  explanation.innerHTML =
    "<strong>CSS Layer:</strong> The 'styled' class is added to the body. Colors, layout, and animations are now active.";

  jsBtn.disabled = false;
});

// Client JS
jsBtn.addEventListener("click", () => {
  explanation.innerHTML =
    "<strong>Client JS Layer:</strong> Event listeners are attached. The system can now handle user interaction and fetch data.";

  serverBtn.disabled = false;
});

// Fetch 实时数据阶段
serverBtn.addEventListener("click", async () => {
  const feedSelect = document.getElementById("feedSelect");
  const resultBox = document.getElementById("resultBox");
  if (!feedSelect || !resultBox) return;

  latestFeed = feedSelect.value;
  clearFlow();
  setFlowStatus("node-client", "Initiating request...");

  try {
    setTimeout(() => setFlowStatus("node-server", "Express Server processing..."), 400);
    setTimeout(() => setFlowStatus("node-mta", "Fetching from MTA Realtime API..."), 800);

    const response = await fetch(`/api/mta?feed=${latestFeed}`);
    const data = await response.json();

    setTimeout(() => {
      setFlowStatus("node-browser", "Rendering UI...");

      if (data.success) {
        latestMTAData = data.arrivals;
        renderResults(data.arrivals);
      } else {
        resultBox.innerHTML = "Error: Could not reach MTA.";
      }

      dbBtn.disabled = false;
    }, 1200);

  } catch (err) {
    console.error(err);
    setFlowStatus("node-client", "Connection Lost");
  }
});

function renderResults(items) {
  const resultBox = document.getElementById("resultBox");
  if (!resultBox) return;

  resultBox.innerHTML = `
    <div class="route">${latestFeed} Line Results</div>
    <div class="mode-badge" style="background:#2196F3">Live Feed</div>

    ${
      items.length > 0
        ? items
            .map(
              (item) => `
          <div class="result-item" style="border-left: 3px solid #7aa6ff; margin-bottom: 12px; padding: 8px 12px; background: rgba(255,255,255,0.05);">
            <div><strong>Line ${item.route}</strong> — Station: ${item.stopId}</div>
            <div style="font-size: 13px; opacity: 0.8;">Arrival: ${item.arrival}</div>
            <button
              class="save-btn"
              onclick="saveToFav('${item.route}', '${item.stopId}')"
              style="margin-top:8px; cursor:pointer; background:#3d4a63; color:white; border:none; padding:4px 8px; border-radius:4px;"
            >
              Save to Favorites
            </button>
          </div>
        `
            )
            .join("")
        : "No train data available."
    }
  `;
}

// NeDB
window.saveToFav = async function (route, stopId) {
  try {
    const res = await fetch("/api/favorites", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ route, stopId }),
    });

    const json = await res.json();

    if (json.success) {
      alert(`Station ${stopId} saved to NeDB!`);
    }
  } catch (err) {
    alert("Database save failed.");
  }
};

// Database
dbBtn.addEventListener("click", async () => {
  const resultBox = document.getElementById("resultBox");
  clearFlow();
  setFlowStatus("node-server", "Querying NeDB favorites...");

  try {
    const res = await fetch("/api/favorites");
    const json = await res.json();

    if (resultBox && json.success) {
      resultBox.innerHTML = `
        <div class="route">My Favorites</div>
        <div class="mode-badge" style="background:#4caf50">NeDB Persistent Data</div>

        ${
          json.data.length > 0
            ? json.data
                .map(
                  (fav) => `
              <div class="result-item" style="border-left: 3px solid #4caf50;">
                <div><strong>Line:</strong> ${fav.route}</div>
                <div><strong>Station:</strong> ${fav.stopId}</div>
                <div style="font-size:10px; opacity:0.5;">
                  Stored at: ${new Date(fav.time).toLocaleString()}
                </div>
              </div>
            `
                )
                .join("")
            : "<div class='card'>Favorites is empty. Try saving some lines first!</div>"
        }
      `;
    }

    explanation.innerHTML = `
      <strong>NeDB Persistence:</strong><br>
      This data is retrieved from a local NeDB datastore.
      It only contains items you <em>explicitly</em> chose to save, ensuring total privacy.
    `;

    setFlowStatus("node-browser", "Favorites Displayed");
  } catch (err) {
    console.error(err);
    if (resultBox) {
      resultBox.innerHTML = "Database Error.";
    }
  }
});
