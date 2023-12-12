const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const userRouter = require("./routes/user-handler");
const productRouter = require("./routes/product-handler");

const app = express();
app.use(express.json());
app.use(cors());

const PORT = 9000;

const MONGO_DB_URL = "mongodb://localhost:27017/ecommerce";

mongoose
  .connect(MONGO_DB_URL, {})
  .then(function () {
    console.log("MongoDB connected");
  })
  .catch(function (error) {
    console.log("MongoDB connection failed", error);
  });

app.get("/", function (req, res) {
  res.json({
    message: "Hello World",
  });
});

app.use("/user", userRouter);
app.use("/product", productRouter);

app.listen(PORT, function () {
  console.log(`Server started at PORT ${PORT}`);
});
