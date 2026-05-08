const mongoose = require('mongoose');
const dotenv = require('dotenv');
const connectDB = require('./config/db');
const User = require('./models/User');
const Project = require('./models/Project');
const Task = require('./models/Task');
const Activity = require('./models/Activity');

dotenv.config();
connectDB();

const importData = async () => {
  try {
    await Activity.deleteMany();
    await Task.deleteMany();
    await Project.deleteMany();
    await User.deleteMany();

    // 1. Create Users
    const users = await User.create([
      { name: 'Sai Pavan Admin', email: 'admin@test.com', password: 'admin123', role: 'admin' },
      { name: 'Rahul Sharma', email: 'rahul@test.com', password: 'rahul123', role: 'member' },
      { name: 'Priya Reddy', email: 'priya@test.com', password: 'priya123', role: 'member' },
      { name: 'Arjun Kumar', email: 'arjun@test.com', password: 'arjun123', role: 'member' },
    ]);

    const adminUser = users[0];
    const rahul = users[1];
    const priya = users[2];
    const arjun = users[3];

    // 2. Create Projects
    const projects = await Project.insertMany([
      {
        name: 'E-Commerce Platform',
        description: 'Develop a scalable e-commerce application with payment integration, authentication, and admin dashboard.',
        admin: adminUser._id,
        members: [rahul._id, priya._id],
      },
      {
        name: 'Cyber Security Dashboard',
        description: 'Build a security monitoring dashboard with vulnerability reports and analytics.',
        admin: adminUser._id,
        members: [arjun._id, rahul._id],
      },
      {
        name: 'Social Media Platform',
        description: 'Create a social networking application with chat, posts, notifications, and communities.',
        admin: adminUser._id,
        members: [priya._id, arjun._id],
      },
    ]);

    const ecommerce = projects[0];
    const cyber = projects[1];
    const social = projects[2];

    // Dates for tasks
    const now = new Date();
    const threeDaysFromNow = new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000);
    const fiveDaysFromNow = new Date(now.getTime() + 5 * 24 * 60 * 60 * 1000);
    const yesterday = new Date(now.getTime() - 1 * 24 * 60 * 60 * 1000);
    const twoDaysAgo = new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000);

    // 3. Create Tasks
    await Task.insertMany([
      // E-Commerce Tasks
      { title: 'Design Login Page', description: 'Create responsive login UI.', assignedTo: rahul._id, project: ecommerce._id, priority: 'high', status: 'in-progress', dueDate: threeDaysFromNow },
      { title: 'Integrate Razorpay Payment', description: 'Setup payment gateway.', assignedTo: priya._id, project: ecommerce._id, priority: 'high', status: 'pending', dueDate: fiveDaysFromNow },
      { title: 'Build Product API', description: 'Create REST API for products.', assignedTo: rahul._id, project: ecommerce._id, priority: 'medium', status: 'completed', dueDate: yesterday },
      
      // Cyber Security Tasks
      { title: 'Implement JWT Authentication', description: 'Secure endpoints with JWT.', assignedTo: arjun._id, project: cyber._id, priority: 'high', status: 'in-progress', dueDate: yesterday }, // Overdue!
      { title: 'Create Vulnerability Report Module', description: 'Generate PDF reports.', assignedTo: rahul._id, project: cyber._id, priority: 'medium', status: 'pending', dueDate: threeDaysFromNow },
      { title: 'Dashboard Analytics UI', description: 'Build charts and graphs.', assignedTo: arjun._id, project: cyber._id, priority: 'low', status: 'completed', dueDate: twoDaysAgo },

      // Social Media Tasks
      { title: 'Real-time Chat Integration', description: 'Use Socket.io for chat.', assignedTo: priya._id, project: social._id, priority: 'high', status: 'pending', dueDate: yesterday }, // Overdue!
      { title: 'Notification System', description: 'Push notifications setup.', assignedTo: arjun._id, project: social._id, priority: 'medium', status: 'in-progress', dueDate: fiveDaysFromNow },
      { title: 'Community Feed UI', description: 'Infinite scroll feed.', assignedTo: priya._id, project: social._id, priority: 'low', status: 'completed', dueDate: twoDaysAgo },
    ]);

    // 4. Create Activities
    await Activity.insertMany([
      { user: adminUser._id, action: 'created the E-Commerce Platform project', project: ecommerce._id },
      { user: adminUser._id, action: 'added Rahul Sharma and Priya Reddy to E-Commerce Platform' },
      { user: priya._id, action: 'created a new task: Integrate Razorpay Payment', project: ecommerce._id },
      { user: rahul._id, action: 'updated task status for Build Product API to completed', project: ecommerce._id },
      { user: arjun._id, action: 'completed Dashboard Analytics UI', project: cyber._id },
      { user: adminUser._id, action: 'created the Cyber Security Dashboard project', project: cyber._id },
    ]);

    console.log('Data Imported!');
    process.exit();
  } catch (error) {
    console.error(`Error: ${error.message}`);
    process.exit(1);
  }
};

const destroyData = async () => {
  try {
    await Activity.deleteMany();
    await Task.deleteMany();
    await Project.deleteMany();
    await User.deleteMany();

    console.log('Data Destroyed!');
    process.exit();
  } catch (error) {
    console.error(`Error: ${error.message}`);
    process.exit(1);
  }
};

if (process.argv[2] === '-d') {
  destroyData();
} else {
  importData();
}
