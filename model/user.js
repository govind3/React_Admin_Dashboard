const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
  first_name: 
  { 
    type: String, 
    default: null,
    trim:true
  },
  last_name: 
  { 
    type: String, 
    default: null,
    trim:true 
  },
  email: 
  { 
    type: String, 
    unique: true,
    trim:true
  },
  password: 
  { 
    type: String,
    trim:true,
    validate(value){
      if(value.toLowerCase().includes('password')){
        throw new Error('Password cannot contain password')
      }
    }
  },
  token: 
  { 
    type: String 
  },
});

module.exports = mongoose.model("user", userSchema);