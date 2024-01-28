const { ObjectId } = require("mongodb");
const { getDb } = require("../util/database");

class Feed {
  constructor(title, content, creatorId, imageUrl, createdAt) {
    // this._id=_id;
    this.title = title;
    this.content = content;
    this.creatorId = new ObjectId(creatorId);
    this.imageUrl = imageUrl;
    this.createdAt = createdAt;
  }
  static getPosts(page, pageSize) {
    const db = getDb();
    return db
        .collection("feeds")
        .find({})
        .skip((page - 1) * pageSize)
        .limit(pageSize)
        .sort({ "timestamp.createdAt": -1 })
        .toArray();
  }
  save() {
    const db = getDb();
    return db.collection("feeds").insertOne(this);
  }
  static getPostById(postId) {
    const db = getDb();
    return db.collection("feeds").findOne({ _id: new ObjectId(postId) });
  }
  update(prodId) {
    const db = getDb();
    return db.collection("feeds").updateOne(
      { _id: new ObjectId(prodId) },
      {
        $set: this,
      },
    );
  }

  static delete(postId) {
    const db = getDb();
    return db.collection("feeds").deleteOne({ _id: new ObjectId(postId) });
  }

  static getCount() {
    const db = getDb();
    return db.collection("feeds").countDocuments();
  }
}

module.exports = Feed;
