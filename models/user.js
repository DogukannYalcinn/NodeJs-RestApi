const { ObjectId } = require("mongodb");
const { getDb } = require("../util/database");

class User {
  constructor(email, password, name, status, posts) {
    this.email = email;
    this.password = password;
    this.name = name;
    this.status = status;
    this.posts = posts;
  }

  save() {
    const db = getDb();
    return db.collection("users").insertOne(this);
  }

  static findById(userId) {
    const db = getDb();
    return db.collection("users").findOne({ _id: new ObjectId(userId) });
  }

  static checkEmail(email) {
    const db = getDb();
    return db.collection("users").findOne({ email: email });
  }

  static addPost(userId, postId) {
    const db = getDb();
    return db
      .collection("users")
      .updateOne(
        { _id: new ObjectId(userId) },
        { $push: { posts: new ObjectId(postId) } },
      );
  }

  static deletePost(userId,postId){
    const db = getDb();
    return db.collection('users').updateOne({_id:new ObjectId(userId)},{$pull:{posts:new ObjectId(postId)}})
  }

  static checkStatus (userId){
    const db = getDb();
    return db.collection('users').findOne({_id:new ObjectId(userId)},{$projection:{status:1}})
  }
  static updateStatus (userId,newStatus){
    const db = getDb();
    return db.collection('users').updateOne({_id:new ObjectId(userId)},{$set:{status:newStatus}})
  }
  static getPostsUsers(userIds){
    const ids = userIds.map(id=>{
      return new ObjectId(id)
    })
    const db = getDb();
    return db.collection('users').find({_id:{$in:ids}}).toArray()
  }
}

module.exports = User;
