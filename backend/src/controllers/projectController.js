const Project = require('../models/Project');
const Activity = require('../models/Activity');

// @desc    Create a project
// @route   POST /api/projects
// @access  Private/Admin
const createProject = async (req, res, next) => {
  try {
    const { name, description, members, dueDate, status } = req.body;

    const project = new Project({
      name,
      description,
      admin: req.user._id,
      members: members || [],
      dueDate,
      status: status || 'active',
    });

    const createdProject = await project.save();
    
    await Activity.create({
      user: req.user._id,
      action: `created the project ${createdProject.name}`,
      project: createdProject._id
    });

    res.status(201).json(createdProject);
  } catch (error) {
    next(error);
  }
};

// @desc    Get all projects
// @route   GET /api/projects
// @access  Private
const getProjects = async (req, res, next) => {
  try {
    // Admin sees all projects, members see projects they are part of
    let query = {};
    if (req.user.role !== 'admin') {
      query = { members: req.user._id };
    }

    const projects = await Project.find(query).populate('admin', 'name email').populate('members', 'name email');
    res.json(projects);
  } catch (error) {
    next(error);
  }
};

// @desc    Get project by ID
// @route   GET /api/projects/:id
// @access  Private
const getProjectById = async (req, res, next) => {
  try {
    const project = await Project.findById(req.params.id)
      .populate('admin', 'name email')
      .populate('members', 'name email');

    if (project) {
      // Check if user has access
      if (req.user.role !== 'admin' && !project.members.some(m => m._id.toString() === req.user._id.toString())) {
         res.status(403);
         throw new Error('Not authorized to view this project');
      }
      res.json(project);
    } else {
      res.status(404);
      throw new Error('Project not found');
    }
  } catch (error) {
    next(error);
  }
};

// @desc    Update a project
// @route   PUT /api/projects/:id
// @access  Private/Admin
const updateProject = async (req, res, next) => {
  try {
    const { name, description, members, dueDate, status } = req.body;

    const project = await Project.findById(req.params.id);

    if (project) {
      project.name = name || project.name;
      project.description = description !== undefined ? description : project.description;
      project.members = members || project.members;
      project.dueDate = dueDate || project.dueDate;
      project.status = status || project.status;

      const updatedProject = await project.save();
      
      await Activity.create({
        user: req.user._id,
        action: `updated project details for ${updatedProject.name}`,
        project: updatedProject._id
      });

      res.json(updatedProject);
    } else {
      res.status(404);
      throw new Error('Project not found');
    }
  } catch (error) {
    next(error);
  }
};

// @desc    Delete a project
// @route   DELETE /api/projects/:id
// @access  Private/Admin
const deleteProject = async (req, res, next) => {
  try {
    const project = await Project.findById(req.params.id);

    if (project) {
      await Project.deleteOne({ _id: project._id });
      res.json({ message: 'Project removed' });
    } else {
      res.status(404);
      throw new Error('Project not found');
    }
  } catch (error) {
    next(error);
  }
};

module.exports = { createProject, getProjects, getProjectById, updateProject, deleteProject };
