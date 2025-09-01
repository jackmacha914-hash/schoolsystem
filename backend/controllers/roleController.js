const Role = require('../models/Role');

// GET /api/roles with advanced filtering support
exports.getRoles = async (req, res) => {
  try {
    const { search, permission } = req.query;
    let filter = {};

    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } }
      ];
    }
    if (permission) filter.permissions = permission;

    const roles = await Role.find(filter);
    res.json(roles);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err });
  }
};

// POST /api/roles
exports.createRole = async (req, res) => {
  const { name, description, permissions } = req.body;
  try {
    const newRole = new Role({ name, description, permissions });
    await newRole.save();
    res.status(201).json(newRole);
  } catch (err) {
    res.status(400).json({ message: 'Error creating role', error: err });
  }
};

// PUT /api/roles/:id - Update a role
exports.updateRole = async (req, res) => {
  const { id } = req.params;
  const { name, description, permissions } = req.body;
  try {
    const updatedRole = await Role.findByIdAndUpdate(
      id,
      { name, description, permissions },
      { new: true, runValidators: true }
    );
    if (!updatedRole) return res.status(404).json({ message: 'Role not found' });
    res.json(updatedRole);
  } catch (err) {
    res.status(400).json({ message: 'Error updating role', error: err });
  }
};

// DELETE /api/roles/:id - Delete a role
exports.deleteRole = async (req, res) => {
  const { id } = req.params;
  try {
    const deletedRole = await Role.findByIdAndDelete(id);
    if (!deletedRole) return res.status(404).json({ message: 'Role not found' });
    res.json({ message: 'Role deleted', id });
  } catch (err) {
    res.status(400).json({ message: 'Error deleting role', error: err });
  }
};

// DELETE /api/roles (bulk) - Bulk delete roles by IDs
exports.bulkDeleteRoles = async (req, res) => {
  const { ids } = req.body; // expects { ids: [id1, id2, ...] }
  if (!Array.isArray(ids) || ids.length === 0) {
    return res.status(400).json({ message: 'No role IDs provided' });
  }
  try {
    const result = await Role.deleteMany({ _id: { $in: ids } });
    res.json({ message: 'Roles deleted', count: result.deletedCount });
  } catch (err) {
    res.status(400).json({ message: 'Error bulk deleting roles', error: err });
  }
};
