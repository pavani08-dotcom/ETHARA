const Activity = require('../models/Activity');

// @desc    Get recent activities
// @route   GET /api/activities
// @access  Private
const getActivities = async (req, res, next) => {
  try {
    // If admin, see all activities. If member, only see activities from projects they belong to
    let query = {};
    if (req.user.role !== 'admin') {
      const Project = require('../models/Project');
      const userProjects = await Project.find({ members: req.user._id }).select('_id');
      const projectIds = userProjects.map((p) => p._id);
      
      query = {
        $or: [
          { project: { $in: projectIds } },
          { user: req.user._id }
        ]
      };
    }

    const activities = await Activity.find(query)
      .populate('user', 'name')
      .populate('project', 'name')
      .sort({ createdAt: -1 })
      .limit(10);

    res.json(activities);
  } catch (error) {
    next(error);
  }
};

module.exports = { getActivities };
