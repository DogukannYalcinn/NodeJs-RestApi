const mongodb = require("mongodb");
const mongoClient = mongodb.MongoClient;

let _db ;
const mongoConnect = (callback) => {
  mongoClient
      .connect(
          `mongodb+srv://${process.env.MONGO_USERNAME}:${process.env.MONGO_PASSWORD}@cluster0.qpgxs8z.mongodb.net/${process.env.MONGO_DEFAULT_DATABASE}?retryWrites=true&w=majority`
      )
      .then(client=>{
        _db=client.db();
        callback();
      })
      .catch(err=>{console.log(err)});
};

const getDb = () => {
  if (_db) {
    return _db;
  }
  throw Error("Database is not found!!");
};

exports.mongoConnect = mongoConnect;
exports.getDb =getDb;