const path = require("path");
const express = require("express");
const bodyParser = require("body-parser");
const multer = require("multer");
const crypto = require('crypto');

const mongoConnect = require("./util/database").mongoConnect;
const feedRoutes = require("./routes/feed");
const authRoutes = require("./routes/auth");

const app = express();

const diskStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "images");
  },
  filename:(req,file,cb)=>{
    cb(null, crypto.randomBytes(20).toString('hex')+ '-' + file.originalname)
  }
});

const fileFilter = (req,file,cb)=>{
  if(file.mimetype === 'image/png' || file.mimetype === 'image/jpeg'|| file.mimetype === 'image/jpg'){
    cb(null,true)
  }else{
    cb(null,false)
  }
}

// app.use(bodyParser.urlencoded()); // x-www-form-urlencoded <form>
app.use(bodyParser.json()); // application/json
app.use(multer({storage:diskStorage,fileFilter:fileFilter}).single('image'));
app.use("/images", express.static(path.join(__dirname, "images")));

app.use((req, res, next) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader(
    "Access-Control-Allow-Methods",
    "OPTIONS, GET, POST, PUT, PATCH, DELETE",
  );
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
  next();
});

app.use("/feed", feedRoutes);
app.use("/auth", authRoutes);

app.use((err, req, res, next) => {
  const statusCode = err.statusCode;
  const message = err.message;
  res.status(statusCode).json({ message: message ,data:err.data});
});

mongoConnect(() => {
  app.listen(8080)
  // const server = app.listen(8080);
  // const io = require('./socket').init(server);
  // io.on('connection', socket=>{
  //   console.log('client connected');
  // })
});
