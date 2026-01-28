require("dotenv").config();

const express = require("express");
const { MongoClient, ObjectId } = require("mongodb");

const app = express();
const PORT = process.env.PORT || 3000;
const MONGO_URI = process.env.MONGO_URI;

app.use(express.json());

const DB_NAME = "shop";

let db;

MongoClient.connect(MONGO_URI)
  .then((client) => {
    db = client.db(DB_NAME);
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

/* PRODUCTS */

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

  const result = await db
    .collection("products")
    .find(filter, { projection })
    .sort(sortOption)
    .toArray();

  res.json({ count: result.length, products: result });
});

app.post("/api/products", async (req, res) => {
  const { name, price, category } = req.body;
  if (!name || price === undefined || !category)
    return res.status(400).json({ error: "Missing fields" });

  const result = await db
    .collection("products")
    .insertOne({ name, price, category });

  res.status(201).json({ id: result.insertedId });
});

app.get("/api/products/:id", async (req, res) => {
  try {
    const product = await db.collection("products").findOne({
      _id: new ObjectId(req.params.id),
    });
    if (!product) return res.status(404).json({ error: "Not found" });
    res.json(product);
  } catch {
    res.status(400).json({ error: "Invalid ID" });
  }
});

app.put("/api/products/:id", async (req, res) => {
  const result = await db.collection("products").updateOne(
    { _id: new ObjectId(req.params.id) },
    { $set: req.body }
  );
  if (!result.matchedCount)
    return res.status(404).json({ error: "Not found" });
  res.json({ message: "Updated" });
});

app.delete("/api/products/:id", async (req, res) => {
  const result = await db.collection("products").deleteOne({
    _id: new ObjectId(req.params.id),
  });
  if (!result.deletedCount)
    return res.status(404).json({ error: "Not found" });
  res.json({ message: "Deleted" });
});



app.get("/api/items", async (req, res) => {
  const items = await db.collection("items").find().toArray();
  res.json(items);
});

app.get("/api/items/:id", async (req, res) => {
  try {
    const item = await db.collection("items").findOne({
      _id: new ObjectId(req.params.id),
    });
    if (!item) return res.status(404).json({ error: "Not found" });
    res.json(item);
  } catch {
    res.status(400).json({ error: "Invalid ID" });
  }
});

app.post("/api/items", async (req, res) => {
  const { name, price } = req.body;
  if (!name || price === undefined)
    return res.status(400).json({ error: "Missing fields" });

  const result = await db.collection("items").insertOne({ name, price });
  res.status(201).json({ id: result.insertedId });
});

app.put("/api/items/:id", async (req, res) => {
  const { name, price } = req.body;
  if (!name || price === undefined)
    return res.status(400).json({ error: "Missing fields" });

  const result = await db.collection("items").updateOne(
    { _id: new ObjectId(req.params.id) },
    { $set: { name, price } }
  );
  if (!result.matchedCount)
    return res.status(404).json({ error: "Not found" });
  res.json({ message: "Updated" });
});

app.patch("/api/items/:id", async (req, res) => {
  const result = await db.collection("items").updateOne(
    { _id: new ObjectId(req.params.id) },
    { $set: req.body }
  );
  if (!result.matchedCount)
    return res.status(404).json({ error: "Not found" });
  res.json({ message: "Updated" });
});

app.delete("/api/items/:id", async (req, res) => {
  const result = await db.collection("items").deleteOne({
    _id: new ObjectId(req.params.id),
  });
  if (!result.deletedCount)
    return res.status(404).json({ error: "Not found" });
  res.status(204).send();
});

app.use((req, res) => {
  res.status(404).json({ error: "Endpoint not found" });
});
