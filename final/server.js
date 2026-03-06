const express = require("express");
const fs = require("fs");
const path = require("path");
const Datastore = require("nedb-promises");
const GtfsRealtimeBindings = require("gtfs-realtime-bindings");

const app = express();
const PORT = 3000;

app.use(express.static("public"));
app.use("/final", express.static("public"));
app.use(express.json());

const db = Datastore.create({
  filename: path.join(__dirname, "db", "app.db"),
  autoload: true,
});

const FEEDS = {
  ACE: "https://api-endpoint.mta.info/Dataservice/mtagtfsfeeds/nyct%2Fgtfs-ace",
  "123456": "https://api-endpoint.mta.info/Dataservice/mtagtfsfeeds/nyct%2Fgtfs",
  NQRW: "https://api-endpoint.mta.info/Dataservice/mtagtfsfeeds/nyct%2Fgtfs-nqrw",
  BDFM: "https://api-endpoint.mta.info/Dataservice/mtagtfsfeeds/nyct%2Fgtfs-bdfm",
  L: "https://api-endpoint.mta.info/Dataservice/mtagtfsfeeds/nyct%2Fgtfs-l",
  "7": "https://api-endpoint.mta.info/Dataservice/mtagtfsfeeds/nyct%2Fgtfs-7",
};

let lastGoodByFeed = {};

function loadDemoData() {
  const filePath = path.join(__dirname, "demo-arrivals.json");
  return JSON.parse(fs.readFileSync(filePath, "utf-8"));
}

async function saveRequestLog(feed, mode, count) {
  await db.insert({
    type: "mta_request",
    feed,
    mode,
    count,
    time: Date.now(),
  });
}

app.get("/api/mta", async (req, res) => {
  const feedKey = req.query.feed || "ACE";
  const MTA_URL = FEEDS[feedKey];

  if (!MTA_URL) {
    return res.status(400).json({
      success: false,
      error: "Invalid feed",
    });
  }

  try {
    const response = await fetch(MTA_URL);

    if (!response.ok) {
      throw new Error(`Feed request failed: ${response.status}`);
    }

    const buffer = await response.arrayBuffer();
    const feed = GtfsRealtimeBindings.transit_realtime.FeedMessage.decode(
      new Uint8Array(buffer)
    );

    const now = Math.floor(Date.now() / 1000);
    let arrivals = [];

    for (const entity of feed.entity || []) {
      if (!entity.tripUpdate) continue;

      const trip = entity.tripUpdate.trip;
      const route = trip?.routeId || "Unknown";

      for (const stopTime of entity.tripUpdate.stopTimeUpdate || []) {
        const stopId = stopTime.stopId || "Unknown Stop";
        const arrivalTime = stopTime.arrival?.time;

        if (!arrivalTime) continue;

        const eta = arrivalTime - now;
        if (eta > 0 && eta < 3600) {
          arrivals.push({
            route,
            stopId,
            etaMin: Math.ceil(eta / 60),
          });
        }
      }
    }

    arrivals.sort((a, b) => a.etaMin - b.etaMin);
    arrivals = arrivals.slice(0, 20);

    if (!arrivals.length) {
      throw new Error("Feed parsed but no arrivals found");
    }

    lastGoodByFeed[feedKey] = {
      ts: Date.now(),
      arrivals,
    };

    await saveRequestLog(feedKey, "live", arrivals.length);

    return res.json({
      success: true,
      mode: "live",
      feed: feedKey,
      count: arrivals.length,
      arrivals,
    });
  } catch (error) {
    console.error("MTA fetch error:", error.message);

    if (lastGoodByFeed[feedKey]) {
      await saveRequestLog(feedKey, "cache", lastGoodByFeed[feedKey].arrivals.length);

      return res.json({
        success: true,
        mode: "cache",
        feed: feedKey,
        count: lastGoodByFeed[feedKey].arrivals.length,
        arrivals: lastGoodByFeed[feedKey].arrivals,
      });
    }

    const demoArrivals = loadDemoData().filter((item) => {
      if (feedKey === "ACE") return ["A", "C", "E"].includes(item.route);
      if (feedKey === "123456") return ["1", "2", "3", "4", "5", "6"].includes(item.route);
      if (feedKey === "NQRW") return ["N", "Q", "R", "W"].includes(item.route);
      if (feedKey === "BDFM") return ["B", "D", "F", "M"].includes(item.route);
      if (feedKey === "L") return ["L"].includes(item.route);
      if (feedKey === "7") return ["7"].includes(item.route);
      return true;
    });

    await saveRequestLog(feedKey, "demo", demoArrivals.length);

    return res.json({
      success: true,
      mode: "demo",
      feed: feedKey,
      count: demoArrivals.length,
      arrivals: demoArrivals,
    });
  }
});

app.get("/api/logs", async (req, res) => {
  try {
    const logs = await db
      .find({ type: "mta_request" })
      .sort({ time: -1 })
      .limit(10)
      .exec();

    res.json({
      success: true,
      logs,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: "Failed to load logs",
    });
  }
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});