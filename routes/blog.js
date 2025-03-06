const { Router } = require("express");
const multer = require("multer");
const path = require("path");

const Blog = require("../models/blog");
const Comment = require("../models/comment");

const router = Router();

// Authentication Middleware
function ensureAuthenticated(req, res, next) {
  if (!req.user) {
    return res.redirect("/user/signin");
  }
  next();
}

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, path.resolve(`./public/uploads/`));
  },
  filename: function (req, file, cb) {
    const fileName = `${Date.now()}-${file.originalname}`;
    cb(null, fileName);
  },
});

const upload = multer({ storage: storage });

router.get("/add-new", ensureAuthenticated, (req, res) => {
  return res.render("addBlog", {
    user: req.user
  });
});

router.get("/:id", async (req, res) => {
  const blog = await Blog.findById(req.params.id).populate("createdBy");
  const comments = await Comment.find({ blogId: req.params.id }).populate( "createdBy");

  return res.render("blog", {
    user: req.user,
    blog,
    comments,
  });
});

router.post("/", ensureAuthenticated, upload.single("coverImage"), async (req, res) => {
  const { title, body } = req.body;
  const blog = await Blog.create({
    body,
    title,
    createdBy: req.user._id,
    coverImageURL: `/uploads/${req.file.filename}`,
  });
  return res.redirect(`/blog/${blog._id}`);
});

// render edit blog page


// Render Edit Blog Page (Only for Blog Creator)
router.get("/edit/:id", ensureAuthenticated, async (req, res) => {
  const blog = await Blog.findById(req.params.id);

  if (!blog) {
    return res.status(404).send("Blog not found");
  }

  // Ensure only the owner can edit
  if (blog.createdBy.toString() !== req.user._id.toString()) {
    return res.status(403).send("You are not authorized to edit this blog.");
  }

  res.render("editBlog", { user: req.user, blog });
});

// Handle Blog Update (Only for Blog Creator)
router.post("/edit/:id", ensureAuthenticated, upload.single("coverImage"), async (req, res) => {
  const { title, body } = req.body;
  const blog = await Blog.findById(req.params.id);

  if (!blog) {
    return res.status(404).send("Blog not found");
  }

  // Ensure only the owner can update
  if (blog.createdBy.toString() !== req.user._id.toString()) {
    return res.status(403).send("You are not authorized to update this blog.");
  }

  // Update blog details
  blog.title = title;
  blog.body = body;

  // If a new image is uploaded, update the cover image
  if (req.file) {
    blog.coverImageURL = `/uploads/${req.file.filename}`;
  }

  await blog.save();
  res.redirect(`/blog/${blog._id}`);
});

// Handle Blog Deletion (Only for Blog Creator)
router.post("/delete/:id", ensureAuthenticated, async (req, res) => {
  const blog = await Blog.findById(req.params.id);

  if (!blog) {
    return res.status(404).send("Blog not found");
  }

  // Ensure only the owner can delete
  if (blog.createdBy.toString() !== req.user._id.toString()) {
    return res.status(403).send("You are not authorized to delete this blog.");
  }

  await Blog.findByIdAndDelete(req.params.id);
  res.redirect("/");
});

router.post("/comment/:blogId", ensureAuthenticated, async (req, res) => {
  await Comment.create({
    content: req.body.content,
    blogId: req.params.blogId,
    createdBy: req.user._id,
  });
  return res.redirect(`/blog/${req.params.blogId}`);
});




module.exports = router;
