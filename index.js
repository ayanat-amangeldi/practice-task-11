require("dotenv").config();

const express = require("express");
const { MongoClient, ObjectId } = require("mongodb");

const app = express();
const PORT = process.env.PORT || 3000;
const MONGO_URI = process.env.MONGO_URI;
const API_KEY = process.env.API_KEY;

app.use(express.json());

function apiKeyAuth(req, res, next) {
  const key = req.headers["x-api-key"];

  if (!key) {
    return res.status(401).json({ error: "API key required" });
  }

  if (key !== API_KEY) {
    return res.status(403).json({ error: "Invalid API key" });
  }

  next();
}

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
    updatedAt: "2026-01-18",
  });
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

app.post("/api/items", apiKeyAuth, async (req, res) => {
  const { name, price } = req.body;
  if (!name || price === undefined)
    return res.status(400).json({ error: "Missing fields" });

  const result = await db.collection("items").insertOne({ name, price });
  res.status(201).json({ id: result.insertedId });
});

app.put("/api/items/:id", apiKeyAuth, async (req, res) => {
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

app.patch("/api/items/:id", apiKeyAuth, async (req, res) => {
  const result = await db.collection("items").updateOne(
    { _id: new ObjectId(req.params.id) },
    { $set: req.body }
  );
  if (!result.matchedCount)
    return res.status(404).json({ error: "Not found" });
  res.json({ message: "Updated" });
});

app.delete("/api/items/:id", apiKeyAuth, async (req, res) => {
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

