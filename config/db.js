'use strict';
const mongoose = require('mongoose');
mongoose.connect(process.env.MONGOLAB_URI);
const crypto = require('crypto');
let algo;
let encoding;
let format;
function encrypt(text) {
    let cipher = crypto.createCipher(algo, process.env.SERVER_SECRET);
    let crypted = cipher.update(text, encoding, format);
    crypted += cipher.final(format);
    return crypted;
}
function decrypt(text) {
    if (text === null || typeof text === 'undefined') {
        return text;
    }
    let decipher = crypto.createDecipher(algo, process.env.SERVER_SECRET);
    let dec = decipher.update(text, format, encoding);
    dec += decipher.final(encoding);
    return dec;
}
let userSchema = new mongoose.Schema({
    wid: {
        type: String,
        required: true,
        unique: true,
        index: true
    },
    access_token: { type: String, get: decrypt },
    name: { type: String, default: 'No Name' },
    public_lists: { type: mongoose.Schema.Types.Mixed, default: {} }
});
userSchema.set('toJSON', { getters: true });
userSchema.method(('login'), function (access_token, id, name) {
    return this.findOneAndUpdate({
        wid: id
    }, {
        $set: {
            access_token: encrypt(access_token),
            name: name
        }
    }, {
        upsert: true,
        new: true,
        setDefaultsOnInsert: true,
        runValidators: true
    });
});
mongoose.model('User', userSchema);
