const Task = require('../models/Task');
const Project = require('../models/Project');
const Activity = require('../models/Activity');

// @desc    Create a task
// @route   POST /api/tasks
// @access  Private/Admin
const createTask = async (req, res, next) => {
  try {
    const { title, description, priority, dueDate, project, assignedTo } = req.body;

    // Check if project exists
    const projectExists = await Project.findById(project);
    if (!projectExists) {
      res.status(404);
      throw new Error('Project not found');
    }

    const task = new Task({
      title,
      description,
      priority,
      dueDate,
      project,
      assignedTo,
    });

    const createdTask = await task.save();

    await Activity.create({
      user: req.user._id,
      action: `created a new task: ${createdTask.title}`,
      project: createdTask.project,
      task: createdTask._id
    });

    res.status(201).json(createdTask);
  } catch (error) {
    next(error);
  }
};

// @desc    Get tasks for a project or all tasks if admin
// @route   GET /api/tasks
// @access  Private
const getTasks = async (req, res, next) => {
  try {
    const projectId = req.query.projectId;
    let query = {};

    if (projectId) {
      query.project = projectId;
      // If not admin, verify they are a member of the project
      if (req.user.role !== 'admin') {
         const project = await Project.findById(projectId);
         if (!project || !project.members.includes(req.user._id)) {
            res.status(403);
            throw new Error('Not authorized to view tasks for this project');
         }
      }
    } else {
        // If no project specified, members see tasks assigned to them, admins see all
        if (req.user.role !== 'admin') {
            query.assignedTo = req.user._id;
        }
    }

    const tasks = await Task.find(query)
      .populate('project', 'name')
      .populate('assignedTo', 'name email')
      .populate('comments.user', 'name email')
      .populate('attachments.uploadedBy', 'name email');
    res.json(tasks);
  } catch (error) {
    next(error);
  }
};

// @desc    Update a task status
// @route   PUT /api/tasks/:id/status
// @access  Private
const updateTaskStatus = async (req, res, next) => {
  try {
    const { status } = req.body;
    const task = await Task.findById(req.params.id);

    if (!task) {
      res.status(404);
      throw new Error('Task not found');
    }

    // Admins can update any task, members can only update tasks assigned to them
    if (req.user.role !== 'admin' && task.assignedTo?.toString() !== req.user._id.toString()) {
        res.status(403);
        throw new Error('Not authorized to update this task');
    }

    task.status = status || task.status;
    const updatedTask = await task.save();

    await Activity.create({
      user: req.user._id,
      action: `updated task status for ${task.title} to ${task.status}`,
      project: task.project,
      task: task._id
    });

    res.json(updatedTask);
  } catch (error) {
    next(error);
  }
};

// @desc    Update a task details
// @route   PUT /api/tasks/:id
// @access  Private/Admin
const updateTask = async (req, res, next) => {
  try {
    const { title, description, priority, dueDate, assignedTo } = req.body;
    const task = await Task.findById(req.params.id);

    if (task) {
      task.title = title || task.title;
      task.description = description !== undefined ? description : task.description;
      task.priority = priority || task.priority;
      task.dueDate = dueDate || task.dueDate;
      task.assignedTo = assignedTo || task.assignedTo;

      const updatedTask = await task.save();

      await Activity.create({
        user: req.user._id,
        action: `updated task details for ${updatedTask.title}`,
        project: updatedTask.project,
        task: updatedTask._id
      });

      res.json(updatedTask);
    } else {
      res.status(404);
      throw new Error('Task not found');
    }
  } catch (error) {
    next(error);
  }
};

// @desc    Delete a task
// @route   DELETE /api/tasks/:id
// @access  Private/Admin
const deleteTask = async (req, res, next) => {
  try {
    const task = await Task.findById(req.params.id);

    if (task) {
      await Task.deleteOne({ _id: task._id });
      res.json({ message: 'Task removed' });
    } else {
      res.status(404);
      throw new Error('Task not found');
    }
  } catch (error) {
    next(error);
  }
};

// @desc    Add a comment to a task
// @route   POST /api/tasks/:id/comments
// @access  Private
const addComment = async (req, res, next) => {
  try {
    const { text } = req.body;
    const task = await Task.findById(req.params.id);

    if (!task) {
      res.status(404);
      throw new Error('Task not found');
    }

    const comment = {
      text,
      user: req.user._id,
    };

    task.comments.push(comment);
    await task.save();

    await Activity.create({
      user: req.user._id,
      action: `added a comment to task ${task.title}`,
      project: task.project,
      task: task._id
    });

    const updatedTask = await Task.findById(req.params.id)
      .populate('project', 'name')
      .populate('assignedTo', 'name email')
      .populate('comments.user', 'name email')
      .populate('attachments.uploadedBy', 'name email');

    res.status(201).json(updatedTask);
  } catch (error) {
    next(error);
  }
};

// @desc    Add an attachment to a task
// @route   POST /api/tasks/:id/attachments
// @access  Private
const addAttachment = async (req, res, next) => {
  try {
    const task = await Task.findById(req.params.id);

    if (!task) {
      res.status(404);
      throw new Error('Task not found');
    }

    if (!req.file) {
      res.status(400);
      throw new Error('No file uploaded');
    }

    const attachment = {
      filename: req.file.originalname,
      url: `/uploads/${req.file.filename}`, // Assuming local storage in /uploads
      uploadedBy: req.user._id,
    };

    task.attachments.push(attachment);
    await task.save();

    await Activity.create({
      user: req.user._id,
      action: `added an attachment to task ${task.title}`,
      project: task.project,
      task: task._id
    });

    const updatedTask = await Task.findById(req.params.id)
      .populate('project', 'name')
      .populate('assignedTo', 'name email')
      .populate('comments.user', 'name email')
      .populate('attachments.uploadedBy', 'name email');

    res.status(201).json(updatedTask);
  } catch (error) {
    next(error);
  }
};

module.exports = { createTask, getTasks, updateTaskStatus, updateTask, deleteTask, addComment, addAttachment };
