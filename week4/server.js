const express = require("express");
const app = express();

app.use(express.static("public"));

app.get("/", (req, res) => {
  res.send("Hi nodemon");
});
//req = request;
//res = response;
// => arrow function like an event listener
app.listen(8000, () => {
  console.log("App listening on port 8000");
});
 