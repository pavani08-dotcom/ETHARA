const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const { createTask, getTasks, updateTaskStatus, updateTask, deleteTask, addComment, addAttachment } = require('../controllers/taskController');
const { protect, admin } = require('../middleware/authMiddleware');
const upload = require('../middleware/uploadMiddleware');
const validate = require('../middleware/validate');

router.route('/')
  .get(protect, getTasks)
  .post(protect, admin, [
    body('title', 'Task title is required').notEmpty(),
    body('project', 'Project ID is required').notEmpty()
  ], validate, createTask);

router.route('/:id')
  .put(protect, admin, updateTask)
  .delete(protect, admin, deleteTask);

router.put('/:id/status', protect, [
  body('status', 'Status is required').notEmpty()
], validate, updateTaskStatus);

router.post('/:id/comments', protect, [
  body('text', 'Comment text is required').notEmpty()
], validate, addComment);

router.post('/:id/attachments', protect, upload.single('file'), addAttachment);

module.exports = router;
