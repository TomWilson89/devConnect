const express = require("express");
const router = express.Router();
const auth = require("../../middleware/auth");
const { check, validationResult } = require("express-validator");
const User = require("../../models/User");
const Profile = require("../../models/Profile");
const Post = require("../../models/Post");
const { json } = require("express");
const { remove, findById } = require("../../models/User");

//@route    POST api/posts
//@desc     Create new post
//@access   Private
router.post(
  "/",
  [auth, [check("text", "Text Field is required").not().isEmpty()]],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    try {
      const user = await User.findById(req.user.id);

      let newPost = new Post({
        text: req.body.text,
        name: user.name,
        avatar: user.avatar,
        user: req.user.id,
      });

      await newPost.save();
      return res.json(newPost);
    } catch (err) {
      console.error(err.message);
      return res.status(500).json({ msg: "Server Error" });
    }
  }
);

//@route    GET api/posts
//@desc     Get all posts
//@access   Private
router.get("/", auth, async (req, res) => {
  try {
    const posts = await Post.find().sort({ date: -1 });

    return res.json(posts);
  } catch (err) {
    console.error(err.message);
    return res.status(500).json({ msg: "Server Error" });
  }
});

//@route    GET api/posts/:post_id
//@desc     Get post by id
//@access   Private
router.get("/:post_id", auth, async (req, res) => {
  try {
    const post = await Post.findById(req.params.post_id);

    if (!post) {
      return res.status(404).json({ msg: "Post not found" });
    }

    return res.json(post);
  } catch (err) {
    console.error(err.message);
    if (err.kind === "ObjectId") {
      return res.status(404).json({ msg: "Post no found" });
    }
    return res.status(500).json({ msg: "Server Error" });
  }
});

//@route    DELETE api/posts/:post_id
//@desc     Delte post by id
//@access   Private
router.delete("/:post_id", auth, async (req, res) => {
  try {
    const post = await Post.findById(req.params.post_id);

    if (!post) {
      return res.status(404).json({ msg: "Post not found" });
    }

    await post.remove();

    return res.json({ msg: "Post removed" });
  } catch (err) {
    console.error(err.message);
    if (err.kind === "ObjectId") {
      return res.status(404).json({ msg: "Post no found" });
    }
    return res.status(500).json({ msg: "Server Error" });
  }
});

//@route    PUT api/posts/like/:post_id
//@desc     Like single post
//@access   Private
router.put("/like/:post_id", auth, async (req, res) => {
  try {
    const post = await Post.findById(req.params.post_id);
    if (!post) {
      return res.status(404).json({ msg: "Post not found" });
    }

    if (
      post.likes.filter((post) => post.user.toString() === req.user.id).length >
      0
    ) {
      return res.status(400).json({ msg: "You already likes this post" });
    }

    post.likes.unshift({ user: req.user.id });
    await post.save();

    return res.json(post.likes);
  } catch (err) {
    console.error(err.message);
    return res.status(500).json({ msg: "Server Error" });
  }
});

//@route    PUT api/posts/unlike/:post_id
//@desc     Like single post
//@access   Private
router.put("/unlike/:post_id", auth, async (req, res) => {
  try {
    const post = await Post.findById(req.params.post_id);
    if (!post) {
      return res.status(404).json({ msg: "Post not found" });
    }

    if (
      post.likes.filter((post) => post.user.toString() === req.user.id)
        .length === 0
    ) {
      return res
        .status(400)
        .json({ msg: "You cannot dislike a post you haven't liked" });
    }

    //Find like index
    const removeIndex = post.likes
      .map((item) => item.user.toString())
      .indexOf(req.user.id);

    if (removeIndex === -1) {
      return res.status(400).json({ msg: "Invalid Request" });
    }

    post.likes.splice(removeIndex, 1);
    await post.save();

    return res.json(post.likes);
  } catch (err) {
    console.error(err.message);
    return res.status(500).json({ msg: "Server Error" });
  }
});

//@route    POST api/posts/comment/:post_id
//@desc     Create new comment on a post
//@access   Private
router.post(
  "/comment/:post_id",
  [auth, [check("text", "Text Field is required").not().isEmpty()]],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    try {
      const user = await User.findById(req.user.id);

      const post = await Post.findById(req.params.post_id);

      let newComment = {
        text: req.body.text,
        name: user.name,
        avatar: user.avatar,
        user: req.user.id,
      };

      post.comments.unshift(newComment);

      await post.save();
      return res.json(post.comments);
    } catch (err) {
      console.error(err.message);
      return res.status(500).json({ msg: "Server Error" });
    }
  }
);

//@route    DELETE api/posts/comment/:post_id/:comment_id
//@desc     Delete comment from a post
//@access   Private
router.delete("/comment/:post_id/:comment_id", auth, async (req, res) => {
  try {
    const post = await Post.findById(req.params.post_id);

    //Pull out the comment
    const comment = post.comments.find(
      (comment) => comment.id == req.params.comment_id
    );

    if (!comment) {
      return res.status(404).json({ msg: "Comment does not exists" });
    }

    if (comment.user.toString() !== req.user.id) {
      return res.status(401).json({ msg: "Unothorized request" });
    }

    //find comment index
    const removeIndex = post.comments
      .map((comment) => comment.id.toString())
      .indexOf(req.params.comment_id);

    if (removeIndex === -1) {
      return res.status(404).json({ msg: "Comment not found" });
    }

    post.comments.splice(removeIndex, 1);

    await post.save();
    return res.json(post.comments);
  } catch (err) {
    console.error(err.message);
    return res.status(500).json({ msg: "Server Error" });
  }
});

module.exports = router;
