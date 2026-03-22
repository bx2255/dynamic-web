const express = require("express");
const Datastore = require("nedb-promises");
const GtfsRealtimeBindings = require("gtfs-realtime-bindings");

const fetch = (...args) =>
  import("node-fetch").then(({ default: fetch }) => fetch(...args));

const app = express();
const PORT = 3000;

const db = Datastore.create("favorites.db");

app.use(express.static("public"));
app.use(express.json());

const FEEDS = {
  ACE: "https://api-endpoint.mta.info/Dataservice/mtagtfsfeeds/nyct%2Fgtfs-ace",
  "123456": "https://api-endpoint.mta.info/Dataservice/mtagtfsfeeds/nyct%2Fgtfs",
  NQRW: "https://api-endpoint.mta.info/Dataservice/mtagtfsfeeds/nyct%2Fgtfs-nqrw",
  BDFM: "https://api-endpoint.mta.info/Dataservice/mtagtfsfeeds/nyct%2Fgtfs-bdfm",
  L: "https://api-endpoint.mta.info/Dataservice/mtagtfsfeeds/nyct%2Fgtfs-l",
  "7": "https://api-endpoint.mta.info/Dataservice/mtagtfsfeeds/nyct%2Fgtfs-7",
};

app.get("/api/mta", async (req, res) => {
  const feedKey = req.query.feed || "ACE";
  const MTA_URL = FEEDS[feedKey];

  try {
    const response = await fetch(MTA_URL);

    if (!response.ok) {
      throw new Error("MTA API Down");
    }

    const buffer = await response.arrayBuffer();

    const feed =
      GtfsRealtimeBindings.transit_realtime.FeedMessage.decode(
        new Uint8Array(buffer)
      );

    const arrivals = [];

    feed.entity.forEach((entity) => {
      if (
        entity.tripUpdate &&
        entity.tripUpdate.stopTimeUpdate
      ) {
        entity.tripUpdate.stopTimeUpdate.forEach(
          (update) => {
            if (
              update.arrival &&
              update.arrival.time
            ) {
              arrivals.push({
                route:
                  entity.tripUpdate.trip.routeId,
                stopId: update.stopId,
                arrival: new Date(
                  update.arrival.time * 1000
                ).toLocaleTimeString(),
              });
            }
          }
        );
      }
    });

    res.json({
      success: true,
      arrivals: arrivals.slice(0, 20),
    });

  } catch (error) {
    console.error(error);

    res.status(500).json({
      success: false,
      message: "Could not fetch MTA data",
    });
  }
});


app.post("/api/favorites", async (req, res) => {

  const newFav = {
    route: req.body.route,
    stopId: req.body.stopId,
    time: new Date(),
  };

  const saved = await db.insert(newFav);

  res.json({
    success: true,
    data: saved,
  });

});



app.get("/api/favorites", async (req, res) => {

  const favs = await db
    .find({})
    .sort({ time: -1 });

  res.json({
    success: true,
    data: favs,
  });

});



app.listen(PORT, () => {
  console.log(
    `Server running on http://localhost:${PORT}`
  );
});
