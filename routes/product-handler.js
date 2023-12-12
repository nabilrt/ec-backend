const express = require("express");
const Product = require("../models/product");
const router = express.Router();
const checkLogin = require("../middlewares/auth");
const uploadFile = require("../lib/image-uploader");
const multer = require("multer");
const storage = multer.memoryStorage();
const upload = multer({ storage: storage }).single("file");

router.post("/add", checkLogin, upload, async function (req, res) {
  try {
    const productName = req.body.title;
    const productDescription = req.body.description;
    const productVariant = JSON.parse(req.body.variant);
    const productImage = await uploadFile(req.file);

    const product = new Product({
      title: productName,
      description: productDescription,
      thumbnail: productImage,
      variants: productVariant,
    });
    product
      .save()
      .then(function (result) {
        res.status(201).json({
          message: "Product Created",
          product: result,
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
});

router.get("/list", async function (req, res) {
  try {
    const products = await Product.find();
    res.status(200).json({
      products: products,
    });
  } catch (error) {
    res.status(500).json({
      message: error.message,
    });
  }
});

router.get("/:id", async function (req, res) {
  try {
    const product = await Product.findById(req.params.id);
    res.status(200).json({
      product: product,
    });
  } catch (error) {
    res.status(500).json({
      message: error.message,
    });
  }
});

router.delete("/:id", checkLogin, async function (req, res) {
  try {
    const product = await Product.findByIdAndDelete(req.params.id);
    res.status(200).json({
      message: "Product Deleted",
    });
  } catch (error) {
    res.status(500).json({
      message: error.message,
    });
  }
});

router.post("/:id", checkLogin, async function (req, res) {
  try {
    if (req.file) {
      await Product.updateOne(
        { _id: req.params.id },
        {
          $set: {
            title: req.body.title,
            description: req.body.description,
            thumbnail: await uploadFile(req.file),
            variants: JSON.parse(req.body.variant),
          },
        },
        (err) => {
          if (err) {
            res.status(500).json({
              message: err.message,
            });
          } else {
            res.status(200).json({
              message: "Product Updated",
            });
          }
        }
      );
    } else {
      await Product.updateOne(
        { _id: req.params.id },
        {
          $set: {
            title: req.body.title,
            description: req.body.description,
            variants: JSON.parse(req.body.variant),
          },
        },
        (err) => {
          if (err) {
            res.status(500).json({
              message: err.message,
            });
          } else {
            res.status(200).json({
              message: "Product Updated",
            });
          }
        }
      );
    }
  } catch (error) {
    res.status(500).json({
      message: error.message,
    });
  }
});

module.exports = router;
