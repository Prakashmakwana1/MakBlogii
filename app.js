require("dotenv").config();

const path = require("path");
const express = require("express");
const mongoose = require("mongoose");
const cookiePaser = require("cookie-parser");
const bodyPaser = require("body-parser");
const { check, validationResult } = require("express-validator");

const Blog = require("./models/blog");
const User = require("./models/user");

const userRoute = require("./routes/user");
const blogRoute = require("./routes/blog");



const {
  checkForAuthenticationCookie,
} = require("./middlewares/authentication");

const app = express();
const PORT = process.env.PORT || 8000;

const urlencodedParser = bodyPaser.urlencoded({ extended: false })

mongoose
  .set('strictQuery', true)
   .connect(process.env.MONGO_URL, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then((e) => console.log("MongoDB Connected"));

app.set("view engine", "ejs");
app.set("views", path.resolve("./views"));

app.use(express.urlencoded({ extended: false }));
app.use(cookiePaser());
app.use(checkForAuthenticationCookie("token"));
app.use(express.static(path.resolve("./public")));

app.use((req, res, next) => {
  res.locals.user = req.user || null;  // ✅ Make user available in all EJS templates
  next();
});


app.get("/", async (req, res) => {
  const allBlogs = await Blog.find({}).populate("createdBy");
  res.render("home", {
    user: res.locals.user,
    blogs: allBlogs,
  });
});

app.post("/user/signup", urlencodedParser,  [
  check('fullName', 'Please Enter full name')
    .exists().isLength({ min: 3 }),
  check('email', 'Email is not valid')
    .isEmail().normalizeEmail(),
  check("mobilenumber", "Mobile number must be 10 digits")
    .isNumeric().isLength({ min: 10, max: 10 }),
  check("inputAddress", "Address is required").not().isEmpty(),
  check("gender", "Select a gender").not().isEmpty(),
  check("city", "Select a city").not().isEmpty(),
],
  async (req, res) => {
  const errors = validationResult(req)
  
  if (!errors.isEmpty()) {
      // return res.status(422).jsonp(errors.array())
      const alert = errors.array()
      return res.render('signup', {alert});
    }
  const { fullName, email, password, mobilenumber, inputAddress, gender, city, hobbies } = req.body;

  let hobbiesArray = hobbies || [];
  if (!Array.isArray(hobbiesArray)) hobbiesArray = [hobbiesArray];

  try{
    const newUser = new User({
      fullName: fullName,
      email: email,
      password: password,
      mobilenumber: mobilenumber,
      inputAddress: inputAddress,
      gender: gender,
      city: city,
      hobbies: hobbiesArray,
    });

    await newUser.save();
    console.log(" user saved successfully..")
    res.redirect("/user/signin");
  }catch (err) {
    console.error("error saving user",err);
    res.status(500).send("Srever Error");
  }
  });

app.use("/user", userRoute);
app.use("/blog", blogRoute);

app.listen(PORT, () => console.log(`Server Started at PORT:${PORT}`));
