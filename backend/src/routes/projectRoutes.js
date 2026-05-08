const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const { createProject, getProjects, getProjectById, updateProject, deleteProject } = require('../controllers/projectController');
const { protect, admin } = require('../middleware/authMiddleware');
const validate = require('../middleware/validate');

router.route('/')
  .get(protect, getProjects)
  .post(protect, admin, [
    body('name', 'Project name is required').notEmpty()
  ], validate, createProject);

router.route('/:id')
  .get(protect, getProjectById)
  .put(protect, admin, updateProject)
  .delete(protect, admin, deleteProject);

module.exports = router;
