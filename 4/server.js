const express = require("express");
const app = express();

app.use(express.json());
app.use(express.static("public"));
let projects = [
    {
        id: Date.now(),
        title: "Initial Project",
        year: 2026,
        description: "Memory storage test",     
    }
];

// GET
app.get("/api/projects", (req, res) => {
    res.json(projects);
});

// POST
app.post("/api/projects", (req, res) => {
    const newProject = {
        id: Date.now(),
        title: req.body.title || "Untitled",
        year: Number(req.body.year) || 2026,
        description: req.body.description || "",
    };

    projects.unshift(newProject);
    res.json({ ok: true, project: newProject });
});

// listen 8000 port
app.listen(8000, () => {
  console.log("Server running at http://localhost:8000");
});
