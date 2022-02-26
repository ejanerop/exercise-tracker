const express = require("express");
const bodyparser = require("body-parser");
const {v4: uuidv4} = require("uuid");
const fs = require("fs");
const app = express();
const cors = require("cors");
require("dotenv").config();

app.use(cors());
app.use(express.static("public"));
app.use(bodyparser.urlencoded({extended: false}));
app.use(bodyparser.json());
app.get("/", (req, res) => {
  res.sendFile(__dirname + "/views/index.html");
});

let loadData = () => {
  let data = fs.readFileSync("db/db.json");
  return JSON.parse(data);
};

app.post("/api/users", (req, res) => {
  let db = loadData();
  const {username} = req.body;
  const user = {username, _id: uuidv4()};
  db.users.push(user);
  fs.writeFileSync("db/db.json", JSON.stringify(db));
  res.send(user);
});

app.get("/api/users", (req, res) => {
  let db = loadData();
  res.send(db.users);
});

app.post("/api/users/:id/exercises", (req, res) => {
  let db = loadData();
  let {description, duration, date} = req.body;
  let user = db.users.find((user) => user._id === req.params.id);
  if (!user) {
    req.send("User not found");
  }
  if (!date || date === "") {
    date = new Date();
  } else {
    date = new Date(date);
  }
  const exercise = {
    description,
    duration: parseInt(duration),
    date,
    _id: user._id,
  };
  db.exercises.push(exercise);
  fs.writeFileSync("db/db.json", JSON.stringify(db));
  res.send({
    username: user.username,
    description,
    duration: parseInt(duration),
    date: date.toDateString(),
    _id: user._id,
  });
});

app.get("/api/users/:_id/logs", (req, res) => {
  let db = loadData();
  let user = db.users.find((user) => user._id === req.params._id);
  const {from, to, limit} = req.query;
  if (!user) {
    res.send("User not found");
  }
  let userExercises = db.exercises
    .filter((exercise) => exercise._id === user._id)
    .map((exercise) => {
      exercise.date = new Date(exercise.date);
      return exercise;
    });
  if (from) {
    userExercises = userExercises.filter((exercise) => {
      return exercise.date >= new Date(from);
    });
  }
  if (to) {
    userExercises = userExercises.filter((exercise) => {
      return exercise.date <= new Date(to);
    });
  }
  if (limit) {
    userExercises = userExercises.slice(0, limit);
  }
  res.send({
    username: user.username,
    count: userExercises.length,
    _id: user._id,
    log: userExercises.map((exercise) => ({
      description: exercise.description,
      duration: parseInt(exercise.duration),
      date: exercise.date.toDateString(),
    })),
  });
});

const listener = app.listen(process.env.PORT || 3000, () => {
  console.log("Your app is listening on port " + listener.address().port);
});
