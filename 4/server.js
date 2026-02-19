const express = require("express");
const app = express();

app.use(express.json());
app.use(express.static("public"));// let server read json and public files

let projects = [
    {
        id: Date.now(),
        title: "Test Project",
        year: 2026,
        description:"This is a test project description.",     
    }
]//this is my Json data for testing(in memory, not in a file)

app.get("/api/projects", (req, res) => {
    res.json(projects);
});//read all projects


app.post("/api/projects", (req, res) => {
    const newProject = {
        id: Date.now(),
        title: req.body.title || "Untitled",
        year: Number(req.body.year)||2026,
        description: req.body.description||"",
    };

    projects.unshift(newProject);
    res.json({ok: true, project: newProject});
});

// open server on port 8000
app.listen(8000, () => {
  console.log("Server running at http://localhost:8000");
});
