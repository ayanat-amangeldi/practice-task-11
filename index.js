require("dotenv").config();

const express = require("express");
const { MongoClient, ObjectId } = require("mongodb");

const app = express();
const PORT = process.env.PORT || 3000;
const MONGO_URI = process.env.MONGO_URI;

app.use(express.json());

app.use((req, res, next) => {
  console.log(`${req.method} ${req.url}`);
  next();
});

const DB_NAME = "shop";
const COLLECTION_NAME = "products";

let products;

MongoClient.connect(MONGO_URI)
  .then((client) => {
    const db = client.db(DB_NAME);
    products = db.collection(COLLECTION_NAME);
    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  })
  .catch(() => process.exit(1));

app.get("/", (req, res) => {
  res.json({ message: "API is running" });
});

app.get("/version", (req, res) => {
  res.json({
    version: "1.1",
    updatedAt: "2026-01-18"
  });
});

app.get("/api/products", async (req, res) => {
  const { category, minPrice, sort, fields } = req.query;

  const filter = {};
  if (category) filter.category = category;
  if (minPrice) filter.price = { $gte: Number(minPrice) };

  const sortOption = {};
  if (sort === "price") sortOption.price = 1;

  let projection = {};
  if (fields) {
    fields.split(",").forEach((f) => (projection[f] = 1));
  }

  const result = await products
    .find(filter, { projection })
    .sort(sortOption)
    .toArray();

  res.json({ count: result.length, products: result });
});

app.get("/api/products/:id", async (req, res) => {
  try {
    const product = await products.findOne({
      _id: new ObjectId(req.params.id),
    });
    if (!product) return res.status(404).json({ error: "Not found" });
    res.json(product);
  } catch {
    res.status(400).json({ error: "Invalid ID" });
  }
});

app.post("/api/products", async (req, res) => {
  const { name, price, category } = req.body;
  if (!name || !price || !category)
    return res.status(400).json({ error: "Missing fields" });

  const result = await products.insertOne({ name, price, category });
  res.status(201).json({ id: result.insertedId });
});

app.put("/api/products/:id", async (req, res) => {
  const result = await products.updateOne(
    { _id: new ObjectId(req.params.id) },
    { $set: req.body }
  );
  if (!result.matchedCount)
    return res.status(404).json({ error: "Not found" });
  res.json({ message: "Updated" });
});

app.delete("/api/products/:id", async (req, res) => {
  const result = await products.deleteOne({
    _id: new ObjectId(req.params.id),
  });
  if (!result.deletedCount)
    return res.status(404).json({ error: "Not found" });
  res.json({ message: "Deleted" });
});

app.use((req, res) => {
  res.status(404).json({ error: "Endpoint not found" });
});
