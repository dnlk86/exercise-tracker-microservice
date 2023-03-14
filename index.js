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
const User = require("./src/models/user");
const Session = require("./src/models/session");

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

// Create user
app.post("/api/users", function (req, res) {
    let userName = req.body.username;
    if (!userName) {
        res.json({ error: "insert a username" });
    } else {
        // check if username already exist in db
        User.findOne({ username: userName }).then((retrievedUser) => {
            if (!retrievedUser) {
                // insert username in db
                let user = new User({ username: userName });
                user.save().then((data) => {
                    if (!data) {
                        console.log("error: record not saved!");
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
    console.log(request);

    // check if _id is valid
    var _id = request[":_id"];
    try {
        var id = new mongoose.mongo.ObjectId(_id);
    } catch (err) {
        console.log("error: _id not valid!");
        return;
    }
    var description = request["description"];
    var duration = request["duration"];
    var date = new Date(request["date"]);

    // retrieve user data
    User.findById(id).then((data) => {
        if (!data) {
            console.log("error: user not found!");
        } else {
            console.log(data);
            // insert data into sessions collection
            let session = new Session({
                user_id: _id,
                description: description,
                duration: duration,
                date: date,
            });
            session.save().then((data) => {
                if (!data) {
                    console.log("error: session not saved!");
                } else {
                    res.json(data);
                }
            });
        }
    });
});

const listener = app.listen(process.env.PORT || 3000, () => {
    console.log("Your app is listening on port " + listener.address().port);
});
