const express = require("express");
const cors = require("cors");
const Jwt = require("jsonwebtoken");

require("./db/config");

const User = require("./db/User");
const Product = require("./db/Product");

const port = process.env.PORT || 5000;
const jwtKey = "e-com";
const app = express();

app.use(express.json());
app.use(cors());

app.post("/register", async (req, resp) => {
  let user = new User(req.body);
  let result = await user.save();

  result = result.toObject();
  delete result.password;

  Jwt.sign({ result }, jwtKey, { expiresIn: "2h" }, (err, token) => {
    if (err) {
      resp.send("Something went wrong");
    }
    resp.send({ user: result, auth: token });
  });
});

app.post("/login", async (req, resp) => {
  if (req.body.password && req.body.email) {
    const user = await User.findOne(req.body).select("-password");
    if (user) {
      Jwt.sign({ user }, jwtKey, { expiresIn: "2h" }, (err, token) => {
        if (err) {
          resp.send("Something went wrong");
        }
        resp.send({ user, auth: token });
      });
    } else {
      resp.send("no user fond");
    }
  } else {
    resp.send("no user fond");
  }
});

app.post("/add-product",  async (req, resp) => {
  const product = new Product(req.body);
  const result = await product.save();
  resp.send(result);
});

app.get("/products",verifyToken, async (req, resp) => {
  const products = await Product.find();
  if (products.length > 0) {
    resp.send(products);
  } else {
    resp.send("No products found!");
  }
});

app.delete("/product/:id", async (req, resp) => {
  const result = await Product.deleteOne({ _id: req.params.id });
  resp.send(result);
});

app.get("/product/:id", async (req, resp) => {
  let result = await Product.findOne({ _id: req.params.id });
  if (result) {
    resp.send(result);
  } else {
    resp.send({ result: "No Record Found." });
  }
});

app.put("/product/:id", async (req, resp) => {
  let result = await Product.updateOne(
    { _id: req.params.id },
    {
      $set: req.body,
    }
  );

  resp.send(result);
});

app.get("/search/:query", verifyToken, async (req, resp) => {
  let result = await Product.find({
    $or: [
      {
        name: {
          $regex: req.params.query,
        },
      },
      {
        company: {
          $regex: req.params.query,
        },
      },
    ],
  });
  resp.send(result);
});

function verifyToken(req, resp, next) {
  let token = req.headers["authorization"];
  if (token) {
    Jwt.verify(token, jwtKey, (err, valid) => {
      if (err) {
        resp.status(401).send("Token is not valid");
      } else {
        next();
      }
    });
  } else {
    resp.status(403).send("Please provide a token!");
  }
}

app.listen(port, () => {
  console.log("app listing!");
});
