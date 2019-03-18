const express = require("express");
const router = express.Router();
const mongoose = require("mongoose");
const passport = require("passport");

//Model
const Post = require("../../models/Posts");
const Profile = require("../../models/Profile");

//Validation
const validatePostInput = require("../../validation/post");

// @route   GET api/posts/test
// @desc    Tests post route
// @access  Public
router.get("/test", (req, res) =>
  res.json({
    msg: "Posts works"
  })
);

//@router Get api/post
//@desc Get all posts
//@access Public
router.get("/", async (req, res) => {
  try {
    const posts = await Post.find();
    res.json(posts);
  } catch (error) {
    res.status(404).json({
      noPOstsFound: "No posts found"
    });
  }
});

//@router Get api/posts/:id
//@desc Get post by id
//@access Public
router.get("/:id", async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    res.json(post);
  } catch (error) {
    res.status(404).json({
      noPostsFound: "No post found"
    });
  }
});

//@router Post api/posts/
//@desc Create post
//@access Private
router.post(
  "/",
  passport.authenticate("jwt", {
    session: false
  }),
  async (req, res) => {
    const { errors, isValid } = validatePostInput(req.body);
    if (!isValid) {
      return res.status(400).json(errors);
    }

    const newPost = new Post({
      text: req.body.text,
      name: req.body.name,
      avatar: req.body.avatar,
      user: req.user.id
    });

    try {
      const result = await newPost.save();
      res.json(result);
    } catch (error) {
      res.json(error);
    }
  }
);

//@router Delete api/posts/:id
//@desc Delete posts
//@access Private
router.delete(
  "/:id",
  passport.authenticate("jwt", {
    session: false
  }),
  async (req, res) => {
    const profile = await Profile.findOne({
      user: req.user.id
    });
    const post = await Post.findById(req.params.id);

    if (post.user.toString() !== profile.user.toString()) {
      return res.status(401).json({
        notAuthorized: "User is not Authorized"
      });
    }
    try {
      await post.remove();
      res.send({
        Success: true
      });
    } catch (error) {
      res.status(404).json({
        postnotfound: "No post found"
      });
    }
  }
);

//@router Post api/posts/like/:id
//@desc Like Posts
//@access Private

router.post(
  "/like/:id",
  passport.authenticate("jwt", {
    session: false
  }),
  async (req, res) => {
    try {
      const post = await Post.findById(req.params.id);
      if (
        post.likes.filter(like => like.user.toString() == req.user.id).length >
        0
      ) {
        return res.status(404).json("user already liked the post");
      }
      post.likes.unshift({
        user: req.user.id
      });
      const result = await post.save();
      res.json(result);
    } catch (error) {
      res.json(error);
    }
  }
);

//@router Post api/posts/unlike/:id
//@desc UnLike Posts
//@access Private
router.post(
  "/unlike/:id",
  passport.authenticate("jwt", {
    session: false
  }),
  async (req, res) => {
    const post = await Post.findById(req.params.id);
    if (
      post.likes.filter(item => item.user.toString() === req.user.id).length ===
      0
    ) {
      return res.status(400).json("User has not liked the post");
    }
    const removeIndex = post.likes
      .map(item => item.user.toString())
      .indexOf(req.user.id);
    post.likes.splice(removeIndex, 1);
    try {
      const result = await post.save();
      res.json(result);
    } catch (error) {
      res.json(error);
    }
  }
);

//@router Post api/posts/comment/:id
//@desc create comment
//@access Private

router.post(
  "/comment/:id",
  passport.authenticate("jwt", {
    session: false
  }),
  async (req, res) => {
    const { errors, isValid } = validatePostInput(req.body);
    if (!isValid) {
      return res.status(400).json(errors);
    }
    const post = await Post.findById(req.params.id);
    const { text, name, avatar } = req.body;
    const newComment = {
      text,
      name,
      avatar,
      user: req.user.id
    };

    post.comments.unshift(newComment);
    try {
      const result = await post.save();
      res.json(result);
    } catch (error) {
      res.json(error);
    }
  }
);

//@router Delete api/posts/comment/:id/:comment_id
//@desc Delete comment
//@access Private

router.delete(
  "/comment/:id/:comment_id",
  passport.authenticate("jwt", {
    session: false
  }),
  async (req, res) => {
    const post = await Post.findById(req.params.id);
    //  post.comments.filter(item => console.log(item._id));
    if (
      post.comments.filter(
        item => item._id.toString() === req.params.comment_id
      ).length === 0
    ) {
      //console.log(req.params.comment_id);
      return res.status(404).json("Comment does not exist");
    }
    const removeComment = post.comments
      .map(item => item._id)
      .indexOf(req.params.comment_id);
    post.comments.splice(removeComment, 1);

    try {
      const result = await post.save();
      res.json(result);
    } catch (error) {
      res.json(error);
    }
  }
);

module.exports = router;
