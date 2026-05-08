import React, { useState, useEffect, useContext } from 'react';
import { Link } from 'react-router-dom';
import api from '../utils/api';
import { AuthContext } from '../context/AuthContext';
import { Plus, FolderKanban, Lock, Calendar, CheckCircle2 } from 'lucide-react';
import toast from 'react-hot-toast';
import CreateProjectModal from '../components/CreateProjectModal';
import { formatDistanceToNow, isPast } from 'date-fns';
import { CardSkeleton } from '../components/SkeletonLoader';
import EmptyState from '../components/EmptyState';

const Projects = () => {
  const [projects, setProjects] = useState([]);
  const [tasks, setTasks] = useState([]);
  const { user } = useContext(AuthContext);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('active'); // active, completed, archived

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [projRes, tasksRes] = await Promise.all([
          api.get('/projects'),
          api.get('/tasks')
        ]);
        setProjects(projRes.data);
        setTasks(tasksRes.data);
      } catch (error) {
        toast.error('Failed to fetch data');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const handleCreateProjectClick = () => {
    if (user.role !== 'admin') {
      toast.error('Access Denied: Only Admins can create projects.');
      return;
    }
    setIsModalOpen(true);
  };

  const handleProjectCreated = (newProject) => {
    setProjects([newProject, ...projects]);
  };

  const getProjectStats = (projectId) => {
    const projectTasks = tasks.filter(t => t.project?._id === projectId || t.project === projectId);
    const completed = projectTasks.filter(t => t.status === 'completed').length;
    const total = projectTasks.length;
    const progress = total === 0 ? 0 : Math.round((completed / total) * 100);
    return { completed, total, progress };
  };

  const filteredProjects = projects.filter(p => p.status === activeTab || (!p.status && activeTab === 'active'));

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {Array.from({ length: 6 }).map((_, i) => <CardSkeleton key={i} />)}
      </div>
    );
  }

  return (
    <div>
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-bold text-text">Projects</h1>
          <p className="text-text-muted">Manage all your projects</p>
        </div>
        <button 
          onClick={handleCreateProjectClick}
          className={`flex items-center justify-center gap-2 px-4 py-2 rounded-xl shadow-md transition-colors ${
            user?.role === 'admin' 
              ? 'bg-primary text-white hover:bg-blue-600' 
              : 'bg-surface text-text-muted cursor-not-allowed border border-border'
          }`}
          title={user?.role !== 'admin' ? "Only Admins can create projects" : ""}
        >
          {user?.role === 'admin' ? <Plus size={20} /> : <Lock size={16} />}
          <span>New Project</span>
        </button>
      </div>

      <div className="flex gap-2 mb-6 border-b border-border pb-px overflow-x-auto">
        {['active', 'completed', 'archived'].map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 font-medium text-sm capitalize whitespace-nowrap transition-colors border-b-2 ${
              activeTab === tab ? 'border-primary text-primary' : 'border-transparent text-text-muted hover:text-text hover:border-border'
            }`}
          >
            {tab} Projects
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredProjects.map((project) => {
          const stats = getProjectStats(project._id);
          const isOverdue = project.dueDate && isPast(new Date(project.dueDate)) && project.status !== 'completed';

          return (
            <Link
              key={project._id}
              to={`/projects/${project._id}`}
              className="bg-surface border border-border p-6 rounded-2xl shadow-sm hover:shadow-md hover:border-primary/30 transition-all group flex flex-col"
            >
              <div className="flex items-center justify-between gap-3 mb-3">
                <div className="flex items-center gap-3 text-primary">
                  <FolderKanban size={24} className="group-hover:scale-110 transition-transform" />
                  <h3 className="text-lg font-semibold text-text group-hover:text-primary transition-colors line-clamp-1">
                    {project.name}
                  </h3>
                </div>
                <span className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded-full ${
                  project.status === 'completed' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' :
                  project.status === 'archived' ? 'bg-slate-200 text-slate-700 dark:bg-slate-700 dark:text-slate-300' :
                  'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
                }`}>
                  {project.status || 'Active'}
                </span>
              </div>
              <p className="text-text-muted text-sm mb-5 line-clamp-2 min-h-[40px] flex-1">
                {project.description || 'No description provided.'}
              </p>

              <div className="mb-5">
                <div className="flex justify-between items-center text-xs text-text-muted mb-1.5 font-medium">
                  <span>Progress</span>
                  <span>{stats.progress}% ({stats.completed}/{stats.total})</span>
                </div>
                <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-2 overflow-hidden">
                  <div 
                    className={`h-2 rounded-full transition-all duration-500 ${stats.progress === 100 ? 'bg-green-500' : 'bg-primary'}`} 
                    style={{ width: `${stats.progress}%` }}
                  ></div>
                </div>
              </div>

              <div className="flex justify-between items-center text-sm pt-4 border-t border-border mt-auto">
                <div className="flex items-center gap-1.5 bg-slate-50 dark:bg-slate-800 px-2 py-1 rounded-md text-text-muted text-xs font-medium border border-border">
                  <div className="flex -space-x-2 mr-1">
                    {project.members?.slice(0, 3).map((m, i) => (
                      <div key={i} className="h-5 w-5 bg-blue-100 text-blue-700 rounded-full flex items-center justify-center font-bold text-[8px] border border-white dark:border-slate-800">
                        {m.name?.charAt(0).toUpperCase()}
                      </div>
                    ))}
                  </div>
                  {project.members?.length || 0} Members
                </div>
                
                {project.dueDate && (
                  <span className={`flex items-center gap-1 text-xs font-medium ${isOverdue ? 'text-red-500' : 'text-text-muted'}`}>
                    <Calendar size={14} />
                    {isOverdue ? 'Overdue' : formatDistanceToNow(new Date(project.dueDate), { addSuffix: true })}
                  </span>
                )}
              </div>
            </Link>
          );
        })}
      </div>
      
      {filteredProjects.length === 0 && (
        <div className="mt-8">
          <EmptyState 
            icon={FolderKanban}
            title={`No ${activeTab} projects`}
            description={activeTab === 'active' 
              ? "You haven't been assigned to any projects. Check back later or ask your administrator."
              : `There are no ${activeTab} projects to show.`}
          />
        </div>
      )}

      <CreateProjectModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        onSuccess={handleProjectCreated} 
      />
    </div>
  );
};

export default Projects;
