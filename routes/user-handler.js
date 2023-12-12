const express = require("express");
const User = require("../models/user");
const firebase = require("../db");
require("firebase/storage");
const fstorage = firebase.storage().ref();
global.XMLHttpRequest = require("xhr2");
const multer = require("multer");
const router = express.Router();
const storage = multer.memoryStorage();
const upload = multer({ storage: storage }).single("file");
const bcrypt = require("bcrypt");
const saltRounds = 10;
const jwt = require("jsonwebtoken");
const checkLogin = require("../middlewares/auth");
const mongoose = require("mongoose");

router.post("/signup", upload, async function (req, res) {
  try {
    const file = req.file;
    const timestamp = Date.now();
    const name = file.originalname.split(".")[0];
    const type = file.originalname.split(".")[1];
    const fileName = `${name}_${timestamp}.${type}`;
    const imageRef = fstorage.child(fileName);
    const snapshot = await imageRef.put(file.buffer);
    const downloadURL = await snapshot.ref.getDownloadURL();

    const userFullname = req.body.name;
    const userEmail = req.body.email;
    const userPassword = await bcrypt.hash(req.body.password, saltRounds);

    const user = new User({
      name: userFullname,
      email: userEmail,
      password: userPassword,
      avatar: downloadURL,
    });
    user
      .save()
      .then(function (result) {
        res.status(201).json({
          message: "User Created",
          user: result,
        });
      })
      .catch(function (err) {
        res.status(500).json({
          message: err.message,
        });
      });
  } catch (error) {
    console.log(error);
    res.status(400).send(error.message);
  }

  // const fname = file.originalname.split(".")[0];
  // const type = file.originalname.split(".")[1];
  // const fileName = `${fname}_${timestamp}.${type}`;
  // const imageRef = storage.child(fileName);
  // const snapshot = await imageRef.put(file.buffer);
  // const downloadURL = await snapshot.ref.getDownloadURL();
  // const userFullname = req.name;
  // const userEmail = req.email;
  // const userPassword = req.password;

  // const user = new User({
  //   userFullname,
  //   userEmail,
  //   userPassword,
  //   downloadURL,
  // });
  // user
  //   .save()
  //   .then(function (result) {
  //     res.status(201).json({
  //       message: "User Created",
  //       user: result,
  //     });
  //   })
  //   .catch(function (err) {
  //     res.status(500).json({
  //       message: err.message,
  //     });
  //   });
});

router.post("/login", async function (req, res) {
  const { email, password } = req.body;
  try {
    const user = await User.findOne({ email: email });
    if (!user) {
      return res.status(400).json({
        message: "User not found",
      });
    }
    const match = await bcrypt.compare(password, user.password);
    if (!match) {
      return res.status(400).json({
        message: "Wrong Password",
      });
    }
    const token = jwt.sign(
      {
        name: user.name,
        userId: user._id,
      },
      "secret",
      {
        expiresIn: "1h",
      }
    );
    res.status(200).json({
      message: "Auth Successful",
      token: token,
    });
  } catch (err) {
    res.status(500).json({
      message: err.message,
    });
  }
});

router.get("/details", checkLogin, async function (req, res) {
  try {
    const user = await User.findOne({ _id: req.userData.userId });
    res.status(200).json({
      message: "User Details",
      user: user,
    });
  } catch (err) {
    res.status(500).json({
      message: err.message,
    });
  }
});

router.put("/upload", checkLogin, upload, async function (req, res) {
  try {
    const file = req.file;
    const timestamp = Date.now();
    const name = file.originalname.split(".")[0];
    const type = file.originalname.split(".")[1];
    const fileName = `${name}_${timestamp}.${type}`;
    const imageRef = fstorage.child(fileName);
    await imageRef.put(file.buffer);
    const downloadURL = await imageRef.getDownloadURL();
    await User.updateOne(
      { _id: req.userData.userId },
      { $set: { avatar: downloadURL } },
      (err) => {
        if (err) {
          res.status(500).json({
            message: err.message,
          });
        } else {
          res.status(200).json({
            message: "Avatar Updated",
          });
        }
      }
    );
  } catch (err) {
    console.error(err);
    res.status(500).json({
      message: err.message,
    });
  }
});

router.put("/:id", checkLogin, async (req, res) => {
  const { id } = req.params;
  const { name, email, password } = req.body;

  if (!mongoose.Types.ObjectId.isValid(id))
    return res.status(404).send(`No user with id: ${id}`);

  const updatedUser = { name, email, password, _id: id };
  const newUpdatedUser = {
    ...updatedUser,
    password: await bcrypt.hash(password, saltRounds),
  };
  try {
    await User.findByIdAndUpdate(id, newUpdatedUser, { new: true });
    res.json(updatedUser);
  } catch (err) {
    console.error(err);
    res.status(500).json({
      message: err.message,
    });
  }
});

router.delete("/:id", checkLogin, async (req, res) => {
  const { id } = req.params;

  if (!mongoose.Types.ObjectId.isValid(id))
    return res.status(404).send(`No user with id: ${id}`);

  await User.findByIdAndRemove(id);

  res.json({ message: "User deleted successfully." });
});

module.exports = router;
