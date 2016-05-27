'use strict'

const mongoose = require('mongoose')
// i think this is global?
mongoose.connect(process.env.MONGOLAB_URI)
// Here's the required crypto code
const crypto = require('crypto')
const algo = 'aes-256-cbc'
const encoding = 'utf-8'
const format = 'hex'

// encryption adapted from here: https://gist.github.com/kljensen/7505729
function encrypt (text) {
  var cipher = crypto.createCipher(algo, process.env.SERVER_SECRET)
  var crypted = cipher.update(text, encoding, format)
  crypted += cipher.final(format)
  return crypted
}

function decrypt (text) {
  if (text === null || typeof text === 'undefined') { return text }
  var decipher = crypto.createDecipher(algo, process.env.SERVER_SECRET)
  var dec = decipher.update(text, format, encoding)
  dec += decipher.final(encoding)
  return dec
}

let userSchema = mongoose.Schema({
  wid: {
    type: String,
    required: true,
    unique: true, // this is right from wlist, shouldn't be a problem
    index: true
  },
  // setter is used in findOneAndUpdate
  access_token: {type: String, get: decrypt},
  name: {type: String, default: 'No Name'},
  public_lists: {type: mongoose.Schema.Types.Mixed, default: {}}
})

userSchema.set('toJSON', { getters: true })

userSchema.statics.login = function (access_token, id, name) {
  return this.findOneAndUpdate({
    wid: id
  }, {
    $set: {
      // as long as whenever this is written we call encrypt, it's fine
      access_token: encrypt(access_token),
      name: name
    }
  }, {
    upsert: true,
    new: true,
    setDefaultsOnInsert: true,
    runValidators: true
  })
}

// this is all hella global?
mongoose.model('User', userSchema)
