const firebase = require("../db");
require("firebase/storage");
const fstorage = firebase.storage().ref();
global.XMLHttpRequest = require("xhr2");
const multer = require("multer");
const storage = multer.memoryStorage();
const upload = multer({ storage: storage }).single("file");

const uploadFile = async (file) => {
  const timestamp = Date.now();
  const name = file.originalname.split(".")[0];
  const type = file.originalname.split(".")[1];
  const fileName = `${name}_${timestamp}.${type}`;
  const imageRef = fstorage.child(fileName);
  const snapshot = await imageRef.put(file.buffer);
  const downloadURL = await snapshot.ref.getDownloadURL();
  return downloadURL;
};

module.exports = uploadFile;
