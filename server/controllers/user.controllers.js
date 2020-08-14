const User = require("../models/users.model");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

const register = (req, res) => {
    const {fname, lname, email, password} = req.body;
    console.log(req.body);
    const hash = bcrypt.hashSync(password, 10);
    const token = jwt.sign(email, process.env.JWT_SECRET);
    console.log("hash", hash);
    console.log("jwt", token);
    User.findOne({email})
        .then(doc => {
            if (doc) {
                res.status(400).json({Error: "Already Exist"});
            } else {
                const newUser = new User({
                    fname,
                    lname,
                    token,
                    email,
                    password: hash,
                });
                console.log(newUser);
                newUser
                    .save()
                    .then(user => {
                        user.password = "";
                        res.status(200).json(user);
                        console.log(user);
                    })
                    .catch(err => {
                        console.log(err);
                        res.status(400).json(err);
                    });
            }
        })
        .catch(err => {
            console.log("err", err);
            res.status(400).json(err);
        });
};

const login = (req, res) => {
    const {email, password} = req.body;
    User.findOne({email})
        .then(doc => {
            console.log("dc", doc);
            if (doc) {
                const match = bcrypt.compareSync(password, doc.password);
                if (match) {
                    doc.password = "";
                    res.status(200).json(doc);
                } else {
                    res.status(400).json({Error: "Incorrect Password"});
                }
            } else {
                res.status(404).json({Error: "User Not Found"});
            }
        })
        .catch(err => {
            console.log(err);
            res.status(400).json({Error: "Something went wrong"});
        });
}


const allUsers = (req, res) => {
    User.find()
        .then(docs => {
            res.status(200).json(docs);
        })
        .catch(err => {
            res.status(400).json(err);
        });
};
const fetchUser = (req, res) => {
    const {token} = req.headers;
    User.findOne({token})
        .then(doc => {
            if (doc) {
                doc.password = "";
                res.status(200).json(doc);
            } else {
                res.status(404).json({Error: "User Not Found"});
            }
        })
        .catch(err => {
            console.log(err);
            res.status(400).json({Error: "Something went wrong"});
        });
};
const addChat = (req, res) => {
    const {token} = req.headers;
    const {chat} = req.body;
    User.findOne({token})
        .then(doc => {
            if (doc) {
                // console.log(doc);
                console.log(doc.chats.includes(chat));
                if (!doc.chats.includes(chat)) {
                    doc.chats = [...doc.chats, chat];

                    doc.save().then(user => {
                        doc.password = "";
                        res.status(200).json(doc.chats);
                    });
                } else {
                    res.status(400).json({Error: "Already in chat list"});
                }
            } else {
                res.status(404).json({Error: "User Not Found"});
            }
        })
        .catch(err => {
            console.log(err);
            res.status(400).json({Error: "Something went wrong"});
        });
};
module.exports = {register, login, allUsers, fetchUser, addChat};