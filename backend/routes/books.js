// routes/books.js
const express = require('express');
const Book = require('../models/Book');
const router = express.Router();

// Get all books with advanced filtering support
router.get('/', async (req, res) => {
    try {
        const { search, genre, author, year, status } = req.query;
        let filter = {};

        if (search) {
            filter.$or = [
                { title: { $regex: search, $options: 'i' } },
                { author: { $regex: search, $options: 'i' } },
                { description: { $regex: search, $options: 'i' } }
            ];
        }
        if (genre) filter.genre = genre;
        if (author) filter.author = { $regex: author, $options: 'i' };
        if (year) filter.year = year;
        if (status) filter.status = status;

        const books = await Book.find(filter);
        res.status(200).json(books);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// Add a new book
router.post('/', async (req, res) => {
    const { title, author, year, genre, status } = req.body;
    const book = new Book({ title, author, year, genre, status });

    try {
        await book.save();
        res.status(201).json(book);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
});

module.exports = router;
