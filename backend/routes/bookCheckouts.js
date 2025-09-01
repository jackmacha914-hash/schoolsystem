const express = require('express');
const router = express.Router();
const { check, validationResult } = require('express-validator');
const auth = require('../middleware/auth');
const Book = require('../models/Book');
const BookCheckout = require('../models/BookCheckout');
const User = require('../models/User');

// @route   POST /api/checkouts
// @desc    Check out a book
// @access  Private (Librarian/Admin)
router.post(
    '/',
    [
        auth,
        [
            check('bookId', 'Book ID is required').not().isEmpty(),
            check('studentId', 'Student ID is required').not().isEmpty(),
            check('dueDate', 'Due date is required').isISO8601()
        ]
    ],
    async (req, res) => {
        // Validate request
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        const { bookId, studentId, dueDate } = req.body;

        try {
            // Check if user has permission
            const user = await User.findById(req.user.id);
            if (!user.roles.includes('librarian') && !user.roles.includes('admin')) {
                return res.status(403).json({ msg: 'Not authorized to check out books' });
            }

            // Check if book exists and is available
            const book = await Book.findById(bookId);
            if (!book) {
                return res.status(404).json({ msg: 'Book not found' });
            }

            if (book.availableCopies < 1) {
                return res.status(400).json({ msg: 'No available copies of this book' });
            }

            // Check if student exists
            const student = await User.findOne({
                _id: studentId,
                roles: 'student',
                school: user.school
            });

            if (!student) {
                return res.status(404).json({ msg: 'Student not found' });
            }

            // Check if student has any overdue books
            const overdueCheckouts = await BookCheckout.find({
                student: studentId,
                status: 'overdue',
                returnedDate: null
            });

            if (overdueCheckouts.length > 0) {
                return res.status(400).json({ 
                    msg: 'Student has overdue books that must be returned first',
                    overdueBooks: overdueCheckouts
                });
            }


            // Create checkout record
            const checkout = new BookCheckout({
                book: bookId,
                student: studentId,
                dueDate: new Date(dueDate),
                createdBy: req.user.id,
                school: user.school
            });

            // Update book available copies
            await book.checkout();
            await checkout.save();

            // Populate the response with book and student details
            await checkout.populate('book', 'title author')
                         .populate('student', 'name email')
                         .populate('createdBy', 'name')
                         .execPopulate();

            res.json(checkout);

        } catch (err) {
            console.error(err.message);
            res.status(500).send('Server error');
        }
    }
);

// @route   PUT /api/checkouts/:id/return
// @desc    Return a checked out book
// @access  Private (Librarian/Admin)
router.put('/:id/return', auth, async (req, res) => {
    try {
        // Check if user has permission
        const user = await User.findById(req.user.id);
        if (!user.roles.includes('librarian') && !user.roles.includes('admin')) {
            return res.status(403).json({ msg: 'Not authorized to process returns' });
        }

        // Find the checkout record
        const checkout = await BookCheckout.findById(req.params.id)
            .populate('book')
            .populate('student', 'name email');

        if (!checkout) {
            return res.status(404).json({ msg: 'Checkout record not found' });
        }

        // Check if already returned
        if (checkout.returnedDate) {
            return res.status(400).json({ msg: 'This book has already been returned' });
        }

        // Update the book's available copies
        const book = await Book.findById(checkout.book._id);
        await book.returnCopy();

        // Update the checkout record
        checkout.returnedDate = new Date();
        checkout.status = 'returned';
        
        // Calculate fine if returned late
        if (checkout.returnedDate > checkout.dueDate) {
            const daysLate = Math.ceil((checkout.returnedDate - checkout.dueDate) / (1000 * 60 * 60 * 24));
            checkout.fine = daysLate * 0.5; // $0.50 per day late
        }

        await checkout.save();

        res.json(checkout);

    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server error');
    }
});

// @route   GET /api/checkouts/student/:studentId
// @desc    Get all checkouts for a student
// @access  Private (Student/Own/Librarian/Admin)
router.get('/student/:studentId', auth, async (req, res) => {
    try {
        const user = await User.findById(req.user.id);
        const studentId = req.params.studentId;

        // Check if user is authorized to view this student's checkouts
        if (user.roles.includes('student') && user.id !== studentId) {
            return res.status(403).json({ msg: 'Not authorized to view these checkouts' });
        }

        const checkouts = await BookCheckout.find({ student: studentId })
            .populate('book', 'title author coverImage')
            .populate('createdBy', 'name')
            .sort('-checkedOutDate');

        res.json(checkouts);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server error');
    }
});

// @route   GET /api/checkouts/overdue
// @desc    Get all overdue checkouts
// @access  Private (Librarian/Admin)
router.get('/overdue', auth, async (req, res) => {
    try {
        // Check if user has permission
        const user = await User.findById(req.user.id);
        if (!user.roles.includes('librarian') && !user.roles.includes('admin')) {
            return res.status(403).json({ msg: 'Not authorized' });
        }

        const overdueCheckouts = await BookCheckout.find({
            dueDate: { $lt: new Date() },
            returnedDate: null,
            status: { $ne: 'returned' },
            school: user.school
        })
        .populate('book', 'title author')
        .populate('student', 'name email class')
        .sort('dueDate');

        res.json(overdueCheckouts);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server error');
    }
});

// @route   GET /api/checkouts/current
// @desc    Get all currently checked out books
// @access  Private (Librarian/Admin)
router.get('/current', auth, async (req, res) => {
    try {
        // Check if user has permission
        const user = await User.findById(req.user.id);
        if (!user.roles.includes('librarian') && !user.roles.includes('admin')) {
            return res.status(403).json({ msg: 'Not authorized' });
        }

        const currentCheckouts = await BookCheckout.find({
            returnedDate: null,
            status: { $ne: 'returned' },
            school: user.school
        })
        .populate('book', 'title author')
        .populate('student', 'name email class')
        .sort('dueDate');

        res.json(currentCheckouts);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server error');
    }
});

// @route   PUT /api/checkouts/:id/renew
// @desc    Renew a book checkout
// @access  Private (Librarian/Admin)
router.put('/:id/renew', auth, async (req, res) => {
    try {
        // Check if user has permission
        const user = await User.findById(req.user.id);
        if (!user.roles.includes('librarian') && !user.roles.includes('admin')) {
            return res.status(403).json({ msg: 'Not authorized' });
        }

        const checkout = await BookCheckout.findById(req.params.id);
        
        if (!checkout) {
            return res.status(404).json({ msg: 'Checkout record not found' });
        }

        
        if (checkout.returnedDate) {
            return res.status(400).json({ msg: 'Cannot renew a returned book' });
        }

        // Extend the due date by 2 weeks (14 days)
        const newDueDate = new Date(checkout.dueDate);
        newDueDate.setDate(newDueDate.getDate() + 14);
        
        checkout.dueDate = newDueDate;
        checkout.status = 'checked-out';
        
        await checkout.save();
        
        res.json(checkout);
        
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server error');
    }
});

// @route   GET /api/checkouts/report
// @desc    Generate a report of book checkouts
// @access  Private (Librarian/Admin)
router.get('/report', auth, async (req, res) => {
    try {
        // Check if user has permission
        const user = await User.findById(req.user.id);
        if (!user.roles.includes('librarian') && !user.roles.includes('admin')) {
            return res.status(403).json({ msg: 'Not authorized' });
        }

        const { startDate, endDate } = req.query;
        
        const query = { school: user.school };
        
        if (startDate && endDate) {
            query.checkedOutDate = {
                $gte: new Date(startDate),
                $lte: new Date(endDate)
            };
        }
        
        const checkouts = await BookCheckout.find(query)
            .populate('book', 'title author')
            .populate('student', 'name email class')
            .populate('createdBy', 'name')
            .sort('-checkedOutDate');
            
        res.json(checkouts);
        
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server error');
    }
});

module.exports = router;
