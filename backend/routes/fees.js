const express = require('express');
const mongoose = require('mongoose');
const Fee = mongoose.models.Fee || require('../models/Fee');
const router = express.Router();

// GET /api/fees - list all fees with optional filtering
router.get('/', async (req, res) => {
  try {
    console.log('Fetching fees with filters:', req.query);
    
    // Get the User model for student data
    const User = mongoose.models.User || require('../models/User');
    
    // Build the base query
    const query = {};
    
    // Add status filter if provided
    if (req.query.status) {
      query.status = req.query.status;
    }
    
    // Add class filter if provided
    if (req.query.class && req.query.class !== 'All Classes') {
      console.log('Filtering by class:', req.query.class);
      
      // Find students in the specified class first
      const studentsInClass = await User.find(
        { 
          'profile.class': { $regex: new RegExp(req.query.class, 'i') } 
        },
        '_id'
      ).lean();
      
      console.log(`Found ${studentsInClass.length} students in class ${req.query.class}`);
      
      if (studentsInClass.length > 0) {
        const studentIds = studentsInClass.map(s => s._id);
        if (query.student) {
          // If there's already a student filter, combine with AND
          query.$and = [
            { student: query.student },
            { student: { $in: studentIds } }
          ];
          delete query.student;
        } else {
          query.student = { $in: studentIds };
        }
      } else {
        // If no students found in the class, return empty results
        query.student = { $in: [] };
      }
    }
    
    // Add search filter if provided
    if (req.query.search) {
      const searchRegex = new RegExp(req.query.search, 'i');
      
      // Find students matching the search term
      const matchingStudents = await User.find(
        { name: searchRegex },
        '_id'
      ).lean();
      
      const studentIds = matchingStudents.map(s => s._id);
      
      if (query.student) {
        // If we already have a student filter, combine with $and
        query.$and = [
          { student: query.student },
          { student: { $in: studentIds } }
        ];
        delete query.student;
      } else if (studentIds.length > 0) {
        query.student = { $in: studentIds };
      } else {
        // If no matching students, ensure no results
        query.student = { $in: [] };
      }
    }
    
    console.log('Final query:', JSON.stringify(query, null, 2));
    
    // Find fees with the built query
    let fees = await Fee.find(query)
      .populate({
        path: 'student',
        select: 'name email role class profile',
        options: { lean: true }
      })
      .sort({ date: -1 })
      .lean()
      .exec();
      
    console.log(`Found ${fees.length} fee records`);
    
    // Log sample of what we got
    if (fees.length > 0) {
      console.log('First fee record before processing:', JSON.stringify({
        _id: fees[0]._id,
        student: fees[0].student,
        studentType: typeof fees[0].student
      }, null, 2));
    }
    
    // Process each fee to ensure consistent structure
    const processedFees = [];
    for (const fee of fees) {
      try {
        // Convert to plain object if it's a Mongoose document
        const feeObj = fee.toObject ? fee.toObject() : { ...fee };
        
        // Ensure academic fields are included
        feeObj.academicYear = feeObj.academicYear || '';
        feeObj.academicTerm = feeObj.academicTerm || '';
        
        // Ensure student is populated or has at least an ID
        if (feeObj.student && typeof feeObj.student === 'object') {
          // If student is already populated, use it as is
          if (feeObj.student._id) {
            feeObj.student = {
              _id: feeObj.student._id,
              name: feeObj.student.name || 'Unknown Student',
              email: feeObj.student.email || '',
              class: feeObj.student.class || feeObj.student.profile?.class || ''
            };
          }
        } else {
          // If student is just an ID, try to populate it
          const student = await User.findById(feeObj.student).select('name email profile.class').lean();
          if (student) {
            feeObj.student = student;
          } else {
            console.warn(`Student not found for ID: ${feeObj.student}`);
            feeObj.student = { _id: feeObj.student };
          }
        }
        
        // Ensure student object has at least an ID
        if (!feeObj.student) {
          feeObj.student = { _id: feeObj.studentId || 'unknown' };
        }
        
        // Add a displayName property for the frontend
        if (typeof feeObj.student === 'object') {
          feeObj.student.displayName = (
            feeObj.student.name ||
            feeObj.student.email ||
            `Student ${feeObj.student._id.toString().substring(0, 6)}...`
          );
          
          // Add class information if available
          if (!feeObj.student.class && feeObj.student.profile?.class) {
            feeObj.student.class = feeObj.student.profile.class;
          }
        }
        
        processedFees.push(feeObj);
        
      } catch (err) {
        console.error(`Error processing fee ${fee._id}:`, err);
        // Still include the fee even if there was an error processing it
        processedFees.push(fee);
      }
    }
    
    // Log sample data for debugging
    if (processedFees.length > 0) {
      console.log('=== SAMPLE FEE RECORD ===');
      console.log(JSON.stringify({
        _id: processedFees[0]._id,
        student: processedFees[0].student,
        className: processedFees[0].className,
        amount: processedFees[0].amount,
        status: processedFees[0].status,
        academicYear: processedFees[0].academicYear,
        academicTerm: processedFees[0].academicTerm,
        allFields: Object.keys(processedFees[0].toObject ? processedFees[0].toObject() : processedFees[0])
      }, null, 2));
      
      // Log the first 3 fee records for verification
      console.log('=== FIRST 3 FEE RECORDS ===');
      processedFees.slice(0, 3).forEach((fee, index) => {
        console.log(`Record ${index + 1}:`, {
          academicYear: fee.academicYear,
          academicTerm: fee.academicTerm,
          term: fee.term,
          hasAcademicFields: 'academicYear' in fee || 'academicTerm' in fee
        });
      });
    }
    
    res.json(processedFees);
  } catch (err) {
    console.error('Error fetching fees:', err);
    res.status(500).json({ 
      error: 'Error fetching fee records',
      details: err.message,
      stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
    });
  }
});

// POST /api/fees - add a new fee
router.post('/', async (req, res) => {
  try {
    const { student, className, amount, status, date } = req.body;
    if (!student || !className || !amount || !status) {
      return res.status(400).json({ error: 'Student, class, amount, and status are required.' });
    }
    
    // Create fee with all fields from request body
    const feeData = {
      student,
      className,
      amount: parseFloat(amount) || 0,
      status,
      date: date || new Date(),
      // Include academic fields directly
      academicYear: req.body.academicYear || '',
      academicTerm: req.body.academicTerm || '',
      // Include other fields
      ...(req.body.dueDate && { dueDate: req.body.dueDate }),
      feesPerTerm: parseFloat(req.body.feesPerTerm) || 0,
      firstInstallment: parseFloat(req.body.firstInstallment) || 0,
      secondInstallment: parseFloat(req.body.secondInstallment) || 0,
      thirdInstallment: parseFloat(req.body.thirdInstallment) || 0,
      bal: parseFloat(req.body.bal) || 0,
      ...(req.body.notes && { notes: req.body.notes })
    };
    
    // Log the request body and fee data for debugging
    console.log('Request body:', req.body);
    console.log('Fee data to be saved:', feeData);
    
    console.log('Creating new fee with data:', feeData);
    const newFee = new Fee(feeData);
    await newFee.save();
    
    // Convert to plain object and explicitly include all fields
    const savedFee = newFee.toObject();
    
    console.log('Fee created successfully:', savedFee);
    res.status(201).json({ 
      success: true,
      msg: 'Fee added!', 
      fee: {
        ...savedFee,
        academicYear: savedFee.academicYear || '',
        academicTerm: savedFee.academicTerm || ''
      }
    });
  } catch (err) {
    console.error('Error creating fee:', err);
    res.status(500).json({ 
      success: false,
      error: 'Failed to create fee record',
      details: err.message,
      ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
    });
  }
});

// GET /api/fees/:id - get a single fee by ID
router.get('/:id', async (req, res) => {
  try {
    const fee = await Fee.findById(req.params.id)
      .populate({
        path: 'student',
        select: 'name email role class profile',
        options: { lean: true }
      })
      .lean()
      .exec();
      
    if (!fee) {
      return res.status(404).json({ error: 'Fee not found' });
    }
    
    // If student is a string ID, populate it
    if (typeof fee.student === 'string' && fee.student) {
      const User = mongoose.models.User || require('../models/User');
      const student = await User.findById(fee.student)
        .select('name email role class profile')
        .lean();
        
      if (student) {
        fee.student = student;
      }
    }
    
    // Add displayName for the frontend
    if (fee.student && typeof fee.student === 'object') {
      fee.student.displayName = (
        fee.student.name ||
        fee.student.email ||
        `Student ${fee.student._id.toString().substring(0, 6)}...`
      );
    }
    
    res.json(fee);
  } catch (err) {
    console.error(`Error fetching fee ${req.params.id}:`, err);
    res.status(500).json({ 
      error: 'Error fetching fee record',
      details: err.message,
      stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
    });
  }
});

// POST /api/fees/:id/payments - record a payment for a fee
router.post('/:id/payments', async (req, res) => {
  try {
    console.log('Payment request received:', {
      feeId: req.params.id,
      body: req.body,
      headers: req.headers
    });

    const { amount, paymentMethod = 'Cash', reference, notes } = req.body;
    
    if (!amount || isNaN(amount) || amount <= 0) {
      console.log('Invalid amount provided:', amount);
      return res.status(400).json({ 
        success: false,
        error: 'A valid payment amount is required' 
      });
    }
    
    console.log('Looking up fee with ID:', req.params.id);
    
    // Find the fee and ensure it has the required fields
    let fee = await Fee.findById(req.params.id);
    if (!fee) {
      console.log('Fee not found for ID:', req.params.id);
      return res.status(404).json({ 
        success: false,
        error: 'Fee record not found' 
      });
    }
    
    // Handle legacy fee data
    if (!fee.totalAmount) {
      console.log('Legacy fee record detected, migrating data...');
      // Migrate from old fee structure if needed
      if (fee.feesPerTerm) {
        fee.totalAmount = fee.feesPerTerm;
      } else if (fee.firstInstallment || fee.secondInstallment || fee.thirdInstallment) {
        fee.totalAmount = (fee.firstInstallment || 0) + 
                         (fee.secondInstallment || 0) + 
                         (fee.thirdInstallment || 0);
      } else {
        fee.totalAmount = fee.amount || 0;
      }
      
      // Ensure paidAmount exists
      fee.paidAmount = fee.paidAmount || 0;
      
      // Ensure status is valid
      if (fee.status) {
        const status = String(fee.status).toLowerCase();
        if (status === 'pending') fee.status = 'pending';
        else if (status.includes('partially')) fee.status = 'partially_paid';
        else if (status === 'paid') fee.status = 'paid';
        else if (status === 'overdue') fee.status = 'overdue';
        else if (status === 'cancelled' || status === 'canceled') fee.status = 'cancelled';
        else fee.status = 'pending';
      } else {
        fee.status = 'pending';
      }
      
      // Save the updated fee
      await fee.save();
      console.log('Legacy fee record migrated successfully');
    }
    
    console.log('Found fee:', {
      id: fee._id,
      student: fee.student,
      totalAmount: fee.totalAmount,
      paidAmount: fee.paidAmount,
      balance: fee.balance
    });
    
    try {
      // Record the payment
      console.log('Recording payment...');
      await fee.recordPayment({
        amount: parseFloat(amount),
        paymentMethod,
        reference,
        notes,
        recordedBy: req.user?._id // Will be undefined if no auth middleware
      });
      console.log('Payment recorded successfully');
      
      // Refresh the fee to get updated data
      const updatedFee = await Fee.findById(req.params.id)
        .populate({
          path: 'student',
          select: 'name email role class profile',
          options: { lean: true }
        })
        .lean();
      
      console.log('Updated fee data:', {
        id: updatedFee._id,
        paidAmount: updatedFee.paidAmount,
        balance: updatedFee.balance,
        status: updatedFee.status
      });
      
      return res.json({
        success: true,
        message: 'Payment recorded successfully',
        fee: updatedFee
      });
      
    } catch (recordError) {
      console.error('Error in recordPayment method:', {
        error: recordError.message,
        stack: recordError.stack,
        feeId: fee._id,
        amount: amount,
        paymentMethod: paymentMethod
      });
      throw recordError; // Re-throw to be caught by the outer catch
    }
    
  } catch (err) {
    console.error('Error in payment endpoint:', {
      error: err.message,
      stack: err.stack,
      feeId: req.params.id,
      body: req.body
    });
    
    res.status(500).json({ 
      success: false,
      error: 'Error recording payment',
      message: err.message,
      details: process.env.NODE_ENV === 'development' ? err.stack : undefined
    });
  }
});

// DELETE /api/fees/:id - delete a fee
router.delete('/:id', async (req, res) => {
  try {
    const fee = await Fee.findByIdAndDelete(req.params.id);
    if (!fee) {
      return res.status(404).json({ error: 'Fee not found' });
    }
    res.json({ msg: 'Fee deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
