'use strict';

const mongoose = require('mongoose');
// i think this is global?
mongoose.connect('mongodb://localhost/unparse');

let userSchema = mongoose.Schema({
  wid: {
    type: String,
    required: true,
    unique: true, // this is right from wlist, shouldn't be a problem
    index: true
  },
  access_token: String,
  name: {type: String, default: 'No Name'},
  public_lists: {type: mongoose.Schema.Types.Mixed, default: {}}
});

userSchema.statics.login = function(access_token, id, name) {
  return this.findOneAndUpdate({
    wid: id
  }, {
    // should encrypt this
    $set: { 
      access_token: access_token,
      name: name
    }
  }, {
    upsert: true,
    new: true,
    setDefaultsOnInsert: true,
    runValidators: true
  });
};

// this is all hella global?
mongoose.model('User', userSchema);
