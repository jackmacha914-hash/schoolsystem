const mongoose = require('mongoose');

const paymentSchema = new mongoose.Schema({
  amount: { type: Number, required: true },
  paymentDate: { type: Date, default: Date.now },
  paymentMethod: { type: String, default: 'Cash' },
  reference: String,
  notes: String,
  recordedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
}, { timestamps: true });

const feeSchema = new mongoose.Schema({
  student: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  className: { type: String, required: true },
  academicTerm: { 
    type: String, 
    required: [true, 'Academic term is required'],
    enum: {
      values: ['Term 1', 'Term 2', 'Term 3'],
      message: 'Please select a valid term: Term 1, Term 2, or Term 3'
    }
  },
  academicYear: { 
    type: String, 
    required: [true, 'Academic year is required'],
    match: [/^\d{4}\/\d{4}$/, 'Please provide a valid academic year in format YYYY/YYYY']
  },
  
  // Fee details
  totalAmount: { 
    type: Number, 
    required: function() { return this.feesPerTerm == null; },
    default: function() { 
      // For backward compatibility, calculate from installments if they exist
      if (this.feesPerTerm) return this.feesPerTerm;
      if (this.firstInstallment || this.secondInstallment || this.thirdInstallment) {
        return (this.firstInstallment || 0) + (this.secondInstallment || 0) + (this.thirdInstallment || 0);
      }
      return 0;
    }
  },
  paidAmount: { 
    type: Number, 
    default: 0,
    min: 0
  },
  balance: { 
    type: Number, 
    default: function() {
      return Math.max(0, (this.totalAmount || 0) - (this.paidAmount || 0));
    }
  },
  dueDate: { type: Date },
  
  // Payment history
  payments: [paymentSchema],
  
  // Status tracking
  status: {
    type: String,
    enum: {
      values: ['pending', 'partially_paid', 'paid', 'overdue', 'cancelled'],
      message: "'{VALUE}' is not a valid status. Must be one of: 'pending', 'partially_paid', 'paid', 'overdue', 'cancelled'"
    },
    default: 'pending',
    set: function(status) {
      // Handle case-insensitive status and 'Pending' vs 'pending'
      if (typeof status === 'string') {
        status = status.toLowerCase();
        if (status === 'pending') return 'pending';
        if (status === 'partially_paid' || status === 'partially paid') return 'partially_paid';
        if (status === 'paid') return 'paid';
        if (status === 'overdue') return 'overdue';
        if (status === 'cancelled' || status === 'canceled') return 'cancelled';
      }
      return status; // Fall back to original or default
    }
  },
  
  // Additional metadata
  description: String,
  feeType: { type: String, default: 'tuition' }, // tuition, library, sports, etc.
  
  // Legacy fields (for backward compatibility)
  feesPerTerm: Number,
  firstInstallment: Number,
  secondInstallment: Number,
  thirdInstallment: Number,
  bal: Number,
  amount: Number,
  
  // Timestamps
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

// Update balance and status before saving
feeSchema.pre('save', function(next) {
  this.balance = this.totalAmount - this.paidAmount;
  
  // Update status based on payment
  if (this.paidAmount <= 0) {
    this.status = 'pending';
  } else if (this.paidAmount >= this.totalAmount) {
    this.status = 'paid';
  } else {
    this.status = 'partially_paid';
    
    // Check if overdue
    if (this.dueDate && new Date() > this.dueDate) {
      this.status = 'overdue';
    }
  }
  
  this.updatedAt = new Date();
  next();
});

// Add a method to record a payment
feeSchema.methods.recordPayment = async function(paymentData) {
  const payment = {
    amount: paymentData.amount,
    paymentDate: paymentData.paymentDate || new Date(),
    paymentMethod: paymentData.paymentMethod || 'Cash',
    reference: paymentData.reference || `PAY-${Date.now()}`,
    notes: paymentData.notes,
    recordedBy: paymentData.recordedBy
  };
  
  this.payments.push(payment);
  this.paidAmount = (this.paidAmount || 0) + payment.amount;
  
  await this.save();
  return this;
};

// Indexes for better query performance
feeSchema.index({ student: 1, status: 1 });
feeSchema.index({ className: 1, status: 1 });
feeSchema.index({ dueDate: 1 });

module.exports = mongoose.models.Fee || mongoose.model('Fee', feeSchema);
