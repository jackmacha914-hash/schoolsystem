const mongoose = require('mongoose');

const RoleSchema = new mongoose.Schema({
  name: { type: String, required: true, unique: true },
  description: { type: String },
  permissions: [{ type: String }], // e.g. ['Full Access', 'Limited Access', 'View Only']
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Role', RoleSchema);
