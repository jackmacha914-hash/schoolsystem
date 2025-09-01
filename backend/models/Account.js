// models/Account.js
const mongoose = require('mongoose');

const accountSchema = new mongoose.Schema({
    description: { type: String, required: true },
    amount: { type: Number, required: true },
    date: { type: Date, default: Date.now }
});

const Account = mongoose.model('Account', accountSchema);

module.exports = Account;
