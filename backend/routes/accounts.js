// routes/accounts.js
const express = require('express');
const Account = require('../models/Account');
const router = express.Router();

// Get all accounts/fees with advanced filtering support
router.get('/', async (req, res) => {
    try {
        const { search, status, class: className, method, type, dateFrom, dateTo } = req.query;
        let filter = {};

        if (search) {
            filter.$or = [
                { student: { $regex: search, $options: 'i' } },
                { class: { $regex: search, $options: 'i' } },
                { description: { $regex: search, $options: 'i' } }
            ];
        }
        if (status) filter.status = status;
        if (className) filter.class = { $regex: className, $options: 'i' };
        if (method) filter.method = method;
        if (type) filter.type = type;
        if (dateFrom || dateTo) {
            filter.date = {};
            if (dateFrom) filter.date.$gte = new Date(dateFrom);
            if (dateTo) filter.date.$lte = new Date(dateTo);
        }

        const accounts = await Account.find(filter);
        res.status(200).json(accounts);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// Create a new account entry
router.post('/', async (req, res) => {
    const { description, amount, date } = req.body;
    const account = new Account({ description, amount, date });

    try {
        await account.save();
        res.status(201).json(account);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
});

module.exports = router;
