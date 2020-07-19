const express = require("express"); // 
const router = express.Router(); // to use express router 
const gravatar = require("gravatar"); // Get user gravatar 
const bcrypt = require("bcryptjs");
const jwt = require ("jsonwebtoken");
const config = require("config");
const { check, validationResult } = require("express-validator");



const User = require("../../models/User"); // bringing in user model below

//@route    POST api/users
// @desc    Register user
// @access  Public
router.post(
  "/",
  [
    check("name","Name is required") // check for name , 2nd param "Name is required" // custom error msg)
      .not() // check if its there
      .isEmpty(), // check if its not empty 
    check("email", "Please include a valid email").isEmail(), // rule for vaild email 
    check(
      "password",
      "Please enter a password with 6 or more characters"
    ).isLength({ min: 6 }) // rule minimum of 6 
  ],
  async (req, res) => {
    const errors = validationResult(req); // reqset errors to validation results (new variable)
    if (!errors.isEmpty()) { // if there are errors 
      return res.status(400).json({ errors: errors.array() }); // 400 bad request  visible in response method array 
    }
    
    const { name, email, password } = req.body; //req.body get data the below is distructed and pulled out out items

    try {
     
      let user = await User.findOne({ email });  // 1. See if user exist ( Search by email)

      if (user) {
       return res.status(400).json({ errors: [{ msg: "User Already exist" }] });
      }

      const avatar = gravatar.url(email, {   // 2. Get users gravatar based on email
        
        s: "200", //default size
        r: "pg", // rating
        d: "mm" // Gives a default image 
      });

      user = new User({ // Does not save user just create instance 
        name, // passed in objects 
        email,
        avatar,
        password 
      });

      // 3. Ecrypt password before save to database 
      const salt = await bcrypt.genSalt(10); // 10 Reccommended the higher the more secure 

      user.password = await bcrypt.hash(password, salt); // Hashing password putting it into user password

      await user.save(); // Anything that returns a promise you have to use await
      
      
      const payload = {
        user: {
          id:user.id
        }
      }

      jwt.sign(
        payload, 
        config.get("jwtSecret"),
        { expiresIn: 604800 },
        (err,token) => {
          if (err) throw err;
          res.json({ token });
        }
);

      //4. return jsonwebtoken to authenticate and access protected routes 
    } catch (err) {
    console.error(err.message);
    res.status(500).send("Server Error");
    }
  }
);

module.exports = router;
