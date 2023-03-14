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
    try {
        var id = new mongoose.mongo.ObjectId(request[":_id"]);
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
            console.log("error: data not found!");
        } else {
            console.log(data);
        }
    });
});

const listener = app.listen(process.env.PORT || 3000, () => {
    console.log("Your app is listening on port " + listener.address().port);
});
