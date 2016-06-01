'use strict'

const mongoose = require('mongoose')
mongoose.connect(process.env.MONGOLAB_URI)

import crypto = require('crypto')
// these are string literals because that's what .update expects
let algo: 'aes-256-cbc' = 'aes-256-cbc'
let encoding: 'utf8' = 'utf8'
let format: 'hex' = 'hex'

// encryption adapted from here: https://gist.github.com/kljensen/7505729
function encrypt (text:string) {
  let cipher = crypto.createCipher(algo, process.env.SERVER_SECRET)
  let crypted = cipher.update(text, encoding, format)
  crypted += cipher.final(format)
  return crypted
}

function decrypt (text:string) {
  if (text === null || typeof text === 'undefined') { return text }
  let decipher = crypto.createDecipher(algo, process.env.SERVER_SECRET)
  let dec = decipher.update(text, format, encoding)
  dec += decipher.final(encoding)
  return dec
}

let userSchema = new mongoose.Schema({
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

userSchema.statics.login = function(access_token:string, id:number, name:string):User {
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

userSchema.statics.login_locally = function():User {
  // my user id! change it for your local dev
  return this.findOne({ wid: 6452502 })
}

// this is all hella global?
export = mongoose.model('User', userSchema)
