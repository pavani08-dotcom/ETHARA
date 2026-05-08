import React, { useEffect, useState, useContext } from 'react';
import { Link } from 'react-router-dom';
import api from '../utils/api';
import { AuthContext } from '../context/AuthContext';
import { FolderKanban, CheckSquare, Clock, AlertCircle, CalendarX2, Activity as ActivityIcon, Plus } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { CardSkeleton, ListSkeleton } from '../components/SkeletonLoader';

const StatCard = ({ title, value, icon: Icon, colorClass }) => (
  <div className="bg-surface p-6 rounded-2xl shadow-sm border border-border flex items-center gap-4 hover:shadow-md transition-all hover:-translate-y-1">
    <div className={`p-4 rounded-xl ${colorClass}`}>
      <Icon size={24} />
    </div>
    <div>
      <p className="text-sm font-medium text-text-muted">{title}</p>
      <h3 className="text-2xl font-bold text-text">{value}</h3>
    </div>
  </div>
);

const Dashboard = () => {
  const { user } = useContext(AuthContext);
  const [stats, setStats] = useState({
    totalProjects: 0,
    totalTasks: 0,
    completedTasks: 0,
    pendingTasks: 0,
    overdueTasks: 0,
  });
  const [activities, setActivities] = useState([]);
  const [overdueTasksList, setOverdueTasksList] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const [projectsRes, tasksRes, activitiesRes] = await Promise.all([
          api.get('/projects'),
          api.get('/tasks'),
          api.get('/activities')
        ]);

        const projects = projectsRes.data;
        const tasks = tasksRes.data;
        setActivities(activitiesRes.data);

        const now = new Date();
        const overdue = tasks.filter(t => t.status !== 'completed' && t.dueDate && new Date(t.dueDate) < now);

        setOverdueTasksList(overdue);

        setStats({
          totalProjects: projects.length,
          totalTasks: tasks.length,
          completedTasks: tasks.filter((t) => t.status === 'completed').length,
          pendingTasks: tasks.filter((t) => t.status !== 'completed').length, // combines pending/in-progress for chart
          overdueTasks: overdue.length,
        });
      } catch (error) {
        console.error('Failed to fetch dashboard data', error);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  const chartData = [
    { name: 'Completed', value: stats.completedTasks, color: '#10b981' }, // green-500
    { name: 'Pending', value: stats.pendingTasks - stats.overdueTasks, color: '#f59e0b' }, // amber-500
    { name: 'Overdue', value: stats.overdueTasks, color: '#ef4444' }, // red-500
  ].filter(d => d.value > 0);

  if (loading) {
    return (
      <div className="space-y-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
          {Array.from({ length: 5 }).map((_, i) => <CardSkeleton key={i} />)}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="col-span-2"><ListSkeleton count={4} /></div>
          <div><ListSkeleton count={2} /></div>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-bold text-text">Dashboard</h1>
          <p className="text-text-muted">Welcome back, {user?.name}</p>
        </div>
        <div className="flex items-center gap-3">
          <Link to="/tasks" className="flex items-center gap-2 bg-surface text-text font-medium py-2 px-4 rounded-xl border border-border shadow-sm hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">
            <CheckSquare size={18} /> New Task
          </Link>
          {user?.role === 'admin' && (
            <Link to="/projects" className="flex items-center gap-2 bg-primary text-white font-medium py-2 px-4 rounded-xl shadow-lg shadow-primary/30 hover:bg-blue-600 transition-colors">
              <FolderKanban size={18} /> New Project
            </Link>
          )}
        </div>
      </div>

      {overdueTasksList.length > 0 && (
        <div className="mb-8 bg-red-50 dark:bg-red-900/20 border-l-4 border-red-500 p-4 rounded-r-xl flex items-start gap-3">
          <AlertCircle className="text-red-500 mt-0.5" size={20} shrink-0 />
          <div>
            <h3 className="text-red-800 dark:text-red-400 font-bold">You have {overdueTasksList.length} overdue tasks!</h3>
            <p className="text-red-600 dark:text-red-300 text-sm mt-1">Please review your tasks and update their status or due dates.</p>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-8">
        <StatCard title="Total Projects" value={stats.totalProjects} icon={FolderKanban} colorClass="bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400" />
        <StatCard title="Total Tasks" value={stats.totalTasks} icon={CheckSquare} colorClass="bg-purple-100 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400" />
        <StatCard title="Completed" value={stats.completedTasks} icon={Clock} colorClass="bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400" />
        <StatCard title="Pending" value={stats.pendingTasks} icon={ActivityIcon} colorClass="bg-amber-100 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400" />
        <StatCard title="Overdue" value={stats.overdueTasks} icon={CalendarX2} colorClass="bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Charts Section */}
        <div className="bg-surface rounded-2xl shadow-sm border border-border p-6 flex flex-col">
          <h2 className="text-xl font-bold text-text mb-4">Task Analytics</h2>
          <div className="flex-1 min-h-[250px]">
            {chartData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={chartData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {chartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{ backgroundColor: 'var(--color-surface)', borderColor: 'var(--color-border)', borderRadius: '8px' }}
                    itemStyle={{ color: 'var(--color-text)' }}
                  />
                  <Legend verticalAlign="bottom" height={36} iconType="circle" />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-text-muted">No task data available.</div>
            )}
          </div>
        </div>

        {/* Activity Timeline */}
        <div className="lg:col-span-2 bg-surface rounded-2xl shadow-sm border border-border overflow-hidden flex flex-col">
          <div className="p-6 border-b border-border flex items-center gap-2 bg-slate-50/50 dark:bg-slate-800/50">
            <ActivityIcon className="text-primary" size={20} />
            <h2 className="text-xl font-bold text-text">Recent Activity</h2>
          </div>
          
          <div className="p-6 flex-1 overflow-y-auto max-h-[400px]">
            {activities.length > 0 ? (
              <div className="relative border-l-2 border-slate-100 dark:border-slate-700 ml-5 space-y-8">
                {activities.map((activity, index) => (
                  <div key={activity._id} className="relative pl-6">
                    <span className="absolute -left-[11px] top-1 h-5 w-5 rounded-full bg-surface border-4 border-primary z-10"></span>
                    <div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-xl border border-slate-100 dark:border-slate-700 hover:shadow-md transition-shadow">
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-bold text-text">{activity.user?.name}</span>
                        <span className="text-xs text-text-muted bg-white dark:bg-slate-900 px-2 py-1 rounded-md shadow-sm">
                          {formatDistanceToNow(new Date(activity.createdAt), { addSuffix: true })}
                        </span>
                      </div>
                      <p className="text-text-muted text-sm">{activity.action}</p>
                      {activity.project && (
                        <div className="mt-3">
                          <span className="text-xs font-semibold text-primary bg-blue-50 dark:bg-blue-900/30 px-3 py-1 rounded-full border border-blue-100 dark:border-blue-800">
                            {activity.project.name}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <ActivityIcon size={48} className="mx-auto text-slate-300 dark:text-slate-600 mb-3" />
                <p className="text-text-muted">No recent activity to show.</p>
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
};

export default Dashboard;
