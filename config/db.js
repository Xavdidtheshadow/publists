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
  public_lists: {type: mongoose.Schema.Types.Mixed, default: {}}
});

userSchema.statics.login = function(id, access_token) {
  return this.findOneAndUpdate({
    wid: id.id
  }, {
    // should encrypt this
    $set: { access_token: access_token }
  }, {
    upsert: true,
    // return updated object
    new: true,
    setDefaultsOnInsert: true
  });
};

// this is all hella global?
mongoose.model('User', userSchema);
