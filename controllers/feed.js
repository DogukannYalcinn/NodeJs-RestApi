const path = require("path");
const fs = require("fs");
const { validationResult } = require("express-validator");
const io = require('../socket');
const Feed = require("../models/feed");
const User = require("../models/user");

exports.getPosts = async (req, res, next) => {
  const page = +req.query.page;
  const pageSize = 2;
  try {
    const totalItemCount = await Feed.getCount();
    const posts = await Feed.getPosts(page, pageSize);
    const creatorIds = posts.map((post) => {
      return post.creator.toString();
    });
    const uniqueCreatorIds = [...new Set(creatorIds)];
    const postUsers = await User.getPostsUsers(uniqueCreatorIds);
    const populatedPosts = posts.map((post) => {
      return {
        ...post,
        creator: postUsers.find((user) => {
          return user._id.toString() === post.creator.toString();
        }),
        timestamp: {
          createdAt: post.timestamp.createdAt.toISOString(),
          updatedAt: post.timestamp.updatedAt.toISOString(),
        },
      };
    });
    res.status(200).json({
      posts: populatedPosts,
      totalItem: totalItemCount,
    });
  } catch (error) {
    if (!error.statusCode) {
      error.statusCode = 500;
    }
    next(error);
  }
};

exports.createPost = async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const error = new Error("Validation failed,entered data is incorrect!");
    error.statusCode = 422;
    throw error;
  }
  if (!req.file) {
    const error = new Error("No image provided");
    error.statusCode = 422;
    throw error;
  }
  try {
    const user = await User.findById(req.userId);
    if (!user) {
      const error = new Error("User is not exist");
      error.statusCode = 404;
      throw error;
    }
    const title = req.body.title;
    const content = req.body.content;
    const imageUrl = req.file.path.replace("\\", "/");
    const creatorId = user._id;
    const createdAt = new Date().toISOString();
    let post = new Feed(title, content, creatorId, imageUrl, createdAt);
    const savePostResult = await post.save();
    await User.addPost(req.userId, savePostResult.insertedId);
    post = { ...post, creatorName: user.name };
    //io.getIo().emit('posts',{action:'create' , post:post});
    res.status(201).json({
      message: "Post created successfully!",
      post: post,
    });
  } catch (error) {
    if (!error.statusCode) {
      error.statusCode = 500;
    }
    next(error);
  }
};

exports.getPost = async (req, res, next) => {
  const postId = req.params.postId;
  try {
    let post = await Feed.getPostById(postId);
    if (!post) {
      const error = new Error("Could not find post!");
      error.statusCode = 404;
      throw error;
    }
    const creator = await User.findById(post.creatorId.toString());
    post.creatorName= creator.name;
    res.status(200).json(post);

  } catch (error) {
    if (!error.statusCode) {
      error.statusCode = 500;
    }
    next(error);
  }
};

exports.updatePost =async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const error = new Error("Validation failed,entered data is incorrect!");
    error.statusCode = 422;
    throw error;
  }
  const postId = req.params.postId;
  const title = req.body.title;
  const content = req.body.content;


  try {
    const post = await Feed.getPostById(postId);
    if (!post) {
      const error = new Error("Could not find post.");
      error.statusCode = 404;
      throw  error;
    }
    let imageUrl;
    if (req.file) {
      imageUrl = req.file.path.replace("\\", "/");
      clearImage(post.imageUrl);
    } else {
      imageUrl = post.imageUrl;
    }
    if (post.creatorId.toString() !== req.userId) {
      const error = new Error("Not authenticated");
      error.statusCode = 401;
      throw  error;
    }
    const feedInstance = new Feed(
        title,
        content,
        req.userId,
        imageUrl,
        new Date().toISOString(),
    );
    const result = await feedInstance.update(postId);
    const creator = await User.findById(req.userId);
    feedInstance._id =postId;
    feedInstance.creatorName=creator.name;
    //io.getIo().emit('posts' ,{action:'update',post:feedInstance})
    res.status(200).json({ message: "Post updated", result: feedInstance });
  }
  catch (error){
    if (!error.statusCode) {
      error.statusCode = 500;
    }
    next(error);
  }
};

exports.deletePost =async (req, res, next) => {
  const postId = req.params.postId;
  try {
    const post = await Feed.getPostById(postId);
    if (!post) {
      const error = new Error("Could not find post.");
      error.statusCode = 404;
      throw error;
    }
    if (post.creatorId.toString() !== req.userId) {
      const error = new Error("Not authenticated!");
      error.statusCode = 401;
      throw error;
    }
    clearImage(post.imageUrl);
    const result = await Feed.delete(postId);
    await User.deletePost(req.userId, postId);
    //io.getIo().emit('posts',{action:'delete'});
    res.status(200).json({ message: "Post Deleted!", result: result });
  }catch (error){
    if (!error.statusCode) {
      error.statusCode = 500;
    }
    next(error);
  }
};

const clearImage = (imagePath) => {
  fs.unlink(path.join(__dirname, "../", imagePath), (err) => console.log(err));
};
