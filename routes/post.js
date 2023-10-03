const express = require("express");
const router = express.Router();

const Post = require("../models/Post");
const verifyToken = require("../middleware/verifyToken");

// Post a post
router.post("/", verifyToken, async (req, res) => {
  const { text, photoUrl } = req.body;

  try {
    const newPost = new Post({
      userId: req.userId,
      text: text,
      photoUrl: photoUrl,
      createdAt: Date.now(),
    });

    await newPost.save();
    res.json({ success: true, message: "post created", post: newPost });
  } catch (error) {
    console.log(error);
    res.status(500).json({ success: false, message: "Server error!" });
  }
});

// Get post from id
router.post("/all", async (req, res) => {
  const { id } = req.body;
  try {
    const posts = await Post.find({ userId: id });

    res.json({ success: true, posts });
  } catch (error) {
    console.log(error);
    res.status(500).json({ success: false, message: "Server error!" });
  }
});

// Like and unlike post
router.put("/reaction", verifyToken, async (req, res) => {
  const { postId } = req.body;
  try {
    const thePost = await Post.findById(postId);
    if (!thePost) {
      return res
        .status(404)
        .json({ success: false, message: "Post not found" });
    }
    const { like } = thePost;
    const updateCondition = { _id: postId };
    let updateContent;
    let liked;
    if (!like.includes(req.userId)) {
      updateContent = { like: [...like, req.userId] };
      liked = true;
    } else {
      updateContent = {
        like: like.filter((userId) => userId != req.userId),
      };
      liked = false;
    }
    const updateInfo = await Post.findByIdAndUpdate(
      updateCondition,
      updateContent,
      { new: true }
    );
    if (!updateInfo) {
      return res.status(400).json({ success: false, message: "Can't like" });
    }

    const likeNum = updateInfo.like.length;

    res.json({ success: true, like: likeNum, liked: liked });
  } catch (error) {
    console.log(error);
    res.status(500).json({ success: false, message: "Server error!" });
  }
});

// Comment a post
router.put("/comment", verifyToken, async (req, res) => {
  const { postId, comment } = req.body;

  try {
    const thePost = await Post.findById(postId);
    if (!thePost) {
      return res
        .status(404)
        .json({ success: false, message: "Post not found!" });
    }
    const newComment = {
      userId: req.userId,
      comment: comment,
      createdAt: Date.now(),
    };
    let comments = thePost.comments;

    const updateContent = { comments: [...comments, newComment] };

    const updateCondition = { _id: postId };

    const updateInfo = await Post.findOneAndUpdate(
      updateCondition,
      updateContent,
      { new: true }
    );

    if (!updateInfo) {
      return res
        .status(400)
        .json({ success: false, message: "Can't comment!" });
    }
    const postComments = updateInfo.comments;
    res.json({ success: true, postComments });
  } catch (error) {
    console.log(error);
    res.status(500).json({ success: false, message: "Server error!" });
  }
});
module.exports = router;
