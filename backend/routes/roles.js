const express = require('express');
const { getRoles, createRole, updateRole, deleteRole, bulkDeleteRoles } = require('../controllers/roleController');
const { authenticateUser, authorizeRoles } = require('../middleware/authMiddleware');
const router = express.Router();

// GET /api/roles - list roles with filtering (secured)
router.get('/', authenticateUser, authorizeRoles('admin'), getRoles);

// POST /api/roles - create a new role (secured)
router.post('/', authenticateUser, authorizeRoles('admin'), createRole);

// PUT /api/roles/:id - update a role (secured)
router.put('/:id', authenticateUser, authorizeRoles('admin'), updateRole);

// DELETE /api/roles/:id - delete a role (secured)
router.delete('/:id', authenticateUser, authorizeRoles('admin'), deleteRole);

// DELETE /api/roles - bulk delete roles (secured)
router.delete('/', authenticateUser, authorizeRoles('admin'), bulkDeleteRoles);

module.exports = router;
