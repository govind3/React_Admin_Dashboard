require("dotenv").config();
const cors=require('cors')
require("./config/database").connect();
const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const User = require("./model/user");
const auth = require("./middleware/auth");
const emailValidator = require('deep-email-validator');
 
async function isEmailValid(email) {
 return emailValidator.validate(email)
}

const app = express();
app.use(cors());

app.use(express.json({ limit: "50mb" }));

app.post("/login", async (req, res) => {
  try {
    // Get user input
    const { email, password } = req.body;

    if (!(email && password)) {
      res.status(400).send("All input is required");
    }
    const user = await User.findOne({ email });

    if (user && (await bcrypt.compare(password, user.password))) {
      // Create token
      const token = jwt.sign(
        { user_id: user._id, email },
        process.env.TOKEN_KEY,
        {
          expiresIn: "5h",
        }
      );

      // save user token
      user.token = token;

      // user
      return res.status(200).json(user);
    }
    res.status(400).send("Invalid Credentials");
  } catch (err) {
    console.log(err);
  }
});

app.post("/register", async (req, res) => {

  // Our register logic starts here
  try {
    // Get user input
    const { first_name, last_name, email, password } = req.body;

    // Validate user input
    if (!(email && password && first_name && last_name)) {
      res.status(400).send("All input is required");
    }

    const {valid, reason,validators} = await isEmailValid(email)
    if(!(valid))
    {
      //console.log('Please provide a valid email address.')

      return res.status(400).send({
        message:"Please provide a valid email address.",
        reason:validators[reason].reason
      })
    }
    // check if user already exist
    // Validate if user exist in our database
    const oldUser = await User.findOne({ email });

    if (oldUser) {
      return res.status(409).send("User Already Exist. Please Login");
    }

    //Encrypt user password
    encryptedPassword = await bcrypt.hash(password, 10);

    // Create user in our database
    const user = await User.create({
      first_name,
      last_name,
      email: email.toLowerCase(), // sanitize: convert email to lowercase
      password: encryptedPassword,
    });

    // Create token
    const token = jwt.sign(
      { user_id: user._id, email },
      process.env.TOKEN_KEY,
      {
        expiresIn: "5h",
      }
    );
    // save user token
    user.token = token;

    // return new user
    return res.status(201).json(user);
  } catch (err) {
    console.log(err);
  }
  // Our register logic ends here
});

app.post('/forgotPassword', async (req,res)=>{
  
  try{
    const {email} = req.body;

    if(!(email))
    {
      res.status(400).send('All input is required')
    }
    const user = await User.findOne({email});
    if(user)
    {
      return res.status(200).json(user);
    }
    res.status(400).send('email not present in the database!.')

  } catch(e){
    console.log(e);
  }

})

app.put("/updatepassword",async (req,res)=>{
  try{
    const {email} = req.body;
    const user = await User.findOne({email})
    user.password = await bcrypt.hash(req.body.password, 10);
    const updatedUser = await user.save();

    console.log('Password Updated')
    res.status(200).json({
      _id:updatedUser._id,
      email:updatedUser.email,
      password:updatedUser.password,
    })
  }
  catch(e)
  {
    console.log(e);
  }
})

app.post("/welcome", auth, (req, res) => {
  res.status(200).send("Welcome 🙌 ");
});

// This should be the last route else any after it won't work
app.use("*", (req, res) => {
  res.status(404).json({
    success: "false",
    message: "Page not found",
    error: {
      statusCode: 404,
      message: "You reached a route that is not defined on this server",
    },
  });
});

module.exports = app;