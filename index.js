const express = require("express");
const app = express();
const cors = require("cors");
require("dotenv").config();
const bodyParser = require("body-parser");
const mongoose = require("mongoose");

app.use(cors());
app.use(express.static("public"));
app.get("/", (req, res) => {
    res.sendFile(__dirname + "/views/index.html");
});

// Body-parser middleware
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

// Mongo db connection
mongoose
    .connect(process.env.MONGO_URI, {
        useNewUrlParser: true,
        useUnifiedTopology: true,
        dbName: "exercise-tracker",
    })
    .then(() => {
        console.log(`CONNECTED TO MONGO!`);
    })
    .catch((err) => {
        console.log(`MONGO CONNECTION ERROR!`);
        console.log(err);
    });

// Models import
let User = require("./src/models/user");
let Session = require("./src/models/session");

// Get all users
app.get("/api/users", function (req, res) {
    User.find({}, "_id username").then((data) => {
        if (!data) {
            console.log("No users in the database.");
        } else {
            res.json(data);
        }
    });
});

// Get user's exercise log
app.get("/api/users/:_id/logs", function (req, res) {
    // console.log(req.params);
    // console.log(req.query);

    User.findById(req.params["_id"], "_id username").then((user) => {
        if (!user) {
            console.log("error: user not found!");
        } else {
            Session.find(
                { user_id: req.params["_id"] },
                "description duration date"
            ).then((sessions) => {
                // filters
                const { from, to, limit } = req.query;
                // console.log(limit, from, to);

                let newSessions = sessions.map((exer) => ({
                    description: exer.description,
                    duration: exer.duration,
                    date: exer.date,
                }));

                // applying limit filter
                if (limit) {
                    newSessions = newSessions.slice(0, limit);
                }

                // applying from filter
                if (from) {
                    newSessions = newSessions.filter(
                        (v) => Date.parse(v.date) >= Date.parse(from)
                    );
                }

                // applying to filter
                if (to) {
                    newSessions = newSessions.filter(
                        (v) => Date.parse(v.date) <= Date.parse(to)
                    );
                }

                // console.log(newSessions);

                res.json({
                    _id: user._id,
                    username: user.username,
                    count: newSessions.length,
                    log: newSessions,
                });
            });
        }
    });
});

// Create user
app.post("/api/users", function (req, res) {
    let userName = req.body.username;
    if (!userName) {
        res.json({ error: "insert a username" });
    } else {
        // check if username already exist in db
        User.findOne({ username: userName }).then((retrievedUser) => {
            if (!retrievedUser) {
                // inser username in db
                let user = new User({ username: userName });
                user.save().then((data) => {
                    if (!data) {
                        console.log("error: user not saved!");
                    } else {
                        res.json({
                            username: data["username"],
                            _id: data["_id"],
                        });
                    }
                });
            } else {
                res.json({
                    username: retrievedUser["username"],
                    _id: retrievedUser["_id"],
                });
            }
        });
    }
});

// Create session
app.post("/api/users/:_id/exercises", function (req, res) {
    var request = req.body;
    // check if _id is valid
    var _id = req.params["_id"];
    try {
        var id = new mongoose.Types.ObjectId(_id);
    } catch (err) {
        console.log("error: _id not valid!");
        return;
    }
    var description = request["description"];
    var duration = request["duration"];
    // in case no date is provided by the user set date to now
    var date = new Date();
    // check if user provides a date
    if (request["date"] !== undefined) {
        try {
            date = new Date(request["date"]);
        } catch (err) {
            console.log(err);
        }
    }

    // retrieve user data
    User.findById(_id).then((user) => {
        if (!user) {
            console.log("error: user not found!");
        } else {
            // insert data into sessions collection
            let exSession = new Session({
                user_id: _id,
                description: description,
                duration: duration,
                date: date.toDateString(),
            });
            exSession.save().then((exercise) => {
                if (!exercise) {
                    console.log("error: exercise session not saved!");
                } else {
                    res.json({
                        _id: user._id,
                        username: user.username,
                        date: exercise.date,
                        duration: exercise.duration,
                        description: exercise.description,
                    });
                }
            });
        }
    });
});

const listener = app.listen(process.env.PORT || 3000, () => {
    console.log("Your app is listening on port " + listener.address().port);
});
