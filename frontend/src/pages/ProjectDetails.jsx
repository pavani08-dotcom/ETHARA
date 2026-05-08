import React, { useState, useEffect, useContext } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../utils/api';
import { AuthContext } from '../context/AuthContext';
import { CheckSquare, Clock, Plus, Loader, CalendarX2, Archive, CheckCircle2, ArrowLeft } from 'lucide-react';
import toast from 'react-hot-toast';
import { format, isPast, isToday, formatDistanceToNow, differenceInDays } from 'date-fns';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import CreateTaskModal from '../components/CreateTaskModal';

const TaskCard = ({ task, onStatusChange, isUpdating, index }) => {
  const { user } = useContext(AuthContext);
  
  const isOverdue = task.dueDate && isPast(new Date(task.dueDate)) && task.status !== 'completed' && !isToday(new Date(task.dueDate));

  const statusColors = {
    pending: 'bg-orange-100 text-orange-700 border-orange-200 dark:bg-orange-900/30 dark:text-orange-400 dark:border-orange-800',
    'in-progress': 'bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-900/30 dark:text-blue-400 dark:border-blue-800',
    completed: 'bg-green-100 text-green-700 border-green-200 dark:bg-green-900/30 dark:text-green-400 dark:border-green-800',
  };

  const priorityColors = {
    low: 'text-slate-500 bg-slate-100 dark:text-slate-300 dark:bg-slate-700',
    medium: 'text-yellow-600 bg-yellow-100 dark:text-yellow-400 dark:bg-yellow-900/30',
    high: 'text-red-600 bg-red-100 dark:text-red-400 dark:bg-red-900/30',
  };

  const isAssignedToMe = task.assignedTo?._id === user._id || task.assignedTo === user._id;
  const canEdit = user.role === 'admin' || isAssignedToMe;

  return (
    <Draggable draggableId={task._id} index={index} isDragDisabled={!canEdit}>
      {(provided, snapshot) => (
        <div
          ref={provided.innerRef}
          {...provided.draggableProps}
          {...provided.dragHandleProps}
          className={`bg-surface p-5 rounded-xl border ${isOverdue ? 'border-red-300 dark:border-red-800 shadow-sm shadow-red-100 dark:shadow-none' : 'border-border shadow-sm'} mb-4 relative overflow-hidden group ${
            snapshot.isDragging ? 'shadow-2xl ring-2 ring-primary rotate-2 scale-105 z-50' : 'hover:border-primary/30 transition-colors'
          } transition-all duration-200 ease-out`}
        >
          {isOverdue && (
            <div className="absolute top-0 right-0 bg-red-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-bl-lg flex items-center gap-1">
              <CalendarX2 size={10} /> OVERDUE
            </div>
          )}
      
      {isUpdating && (
        <div className="absolute inset-0 bg-surface/60 backdrop-blur-[1px] flex items-center justify-center z-10">
          <Loader className="animate-spin text-primary" size={24} />
        </div>
      )}

      <div className="flex justify-between items-start mb-3 pt-2">
        <h4 className={`font-semibold ${isOverdue ? 'text-red-700 dark:text-red-400' : 'text-text'}`}>{task.title}</h4>
      </div>
      
      <p className="text-sm text-text-muted mb-4 line-clamp-2">{task.description}</p>
      
      <div className="flex justify-between items-center text-xs mb-4">
        <span className={`px-2 py-1 rounded-md font-bold uppercase tracking-wider text-[10px] ${priorityColors[task.priority]}`}>
          {task.priority}
        </span>
        {task.dueDate && (
          <span className={`flex items-center gap-1 font-medium ${isOverdue ? 'text-red-600 dark:text-red-400' : 'text-text-muted'}`}>
            <Clock size={14} />
            {format(new Date(task.dueDate), 'MMM d, yyyy')}
          </span>
        )}
      </div>

      <div className="pt-3 border-t border-border flex justify-between items-center">
        <div className="flex items-center gap-2">
           <div className="h-6 w-6 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center text-[10px] font-bold text-slate-600 dark:text-slate-300" title={task.assignedTo?.name}>
             {task.assignedTo?.name ? task.assignedTo.name.charAt(0).toUpperCase() : '?'}
           </div>
           <span className="text-xs text-text-muted truncate max-w-[80px]">
             {isAssignedToMe ? 'You' : task.assignedTo?.name?.split(' ')[0]}
           </span>
        </div>

        {canEdit ? (
          <select 
            className={`text-xs px-2 py-1.5 rounded-lg border font-medium outline-none cursor-pointer bg-transparent ${statusColors[task.status]}`}
            value={task.status}
            onChange={(e) => onStatusChange(task._id, e.target.value)}
            disabled={isUpdating}
          >
            <option value="pending">PENDING</option>
            <option value="in-progress">IN PROGRESS</option>
            <option value="completed">COMPLETED</option>
          </select>
        ) : (
          <span className={`text-xs px-2 py-1 rounded-md border font-medium uppercase ${statusColors[task.status]}`}>
            {task.status.replace('-', ' ')}
          </span>
        )}
      </div>
        </div>
      )}
    </Draggable>
  );
};

const ProjectDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useContext(AuthContext);
  const [project, setProject] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [updatingTaskId, setUpdatingTaskId] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [updatingProject, setUpdatingProject] = useState(false);

  useEffect(() => {
    const fetchProjectDetails = async () => {
      try {
        const [projRes, tasksRes] = await Promise.all([
          api.get(`/projects/${id}`),
          api.get(`/tasks?projectId=${id}`),
        ]);
        setProject(projRes.data);
        setTasks(tasksRes.data);
      } catch (error) {
        if (error.response?.status === 403) {
          toast.error("Access Denied: You are not a member of this project.");
        } else {
          toast.error('Failed to fetch project details');
        }
      } finally {
        setLoading(false);
      }
    };
    fetchProjectDetails();
  }, [id]);

  const handleStatusChange = async (taskId, newStatus) => {
    setUpdatingTaskId(taskId);
    try {
      await api.put(`/tasks/${taskId}/status`, { status: newStatus });
      setTasks(tasks.map(t => t._id === taskId ? { ...t, status: newStatus } : t));
      toast.success('Task status updated!');
    } catch (error) {
      if (error.response?.status === 403) {
        toast.error('Access Denied: You can only update tasks assigned to you.');
      } else {
        toast.error('Failed to update task');
      }
    } finally {
      setUpdatingTaskId(null);
    }
  };

  const handleProjectStatusChange = async (newStatus) => {
    setUpdatingProject(true);
    try {
      const res = await api.put(`/projects/${id}`, { status: newStatus });
      setProject(res.data);
      toast.success(`Project marked as ${newStatus}`);
    } catch (error) {
      toast.error('Failed to update project status');
    } finally {
      setUpdatingProject(false);
    }
  };

  const handleDragEnd = async (result) => {
    if (!result.destination) return;

    const { source, destination, draggableId } = result;

    if (source.droppableId !== destination.droppableId) {
      const taskToMove = tasks.find(t => t._id === draggableId);
      const isAssignedToMe = taskToMove.assignedTo?._id === user._id || taskToMove.assignedTo === user._id;
      const canEdit = user.role === 'admin' || isAssignedToMe;
      
      if (!canEdit) {
         toast.error('Access Denied: You can only move tasks assigned to you.');
         return;
      }

      // Optimistic update
      const newStatus = destination.droppableId;
      const prevTasks = [...tasks];
      setTasks(tasks.map(t => t._id === draggableId ? { ...t, status: newStatus } : t));
      
      try {
        await api.put(`/tasks/${draggableId}/status`, { status: newStatus });
        toast.success('Task moved successfully!');
      } catch (error) {
         setTasks(prevTasks); // Revert on failure
         toast.error('Failed to move task');
      }
    }
  };

  const handleAddTaskClick = () => {
    if (user.role !== 'admin') {
      toast.error('Access Denied: Only Admins can add tasks.');
      return;
    }
    setIsModalOpen(true);
  };

  const handleTaskCreated = (newTask) => {
    api.get(`/tasks?projectId=${id}`).then(res => setTasks(res.data));
  };

  if (loading) return <div className="flex justify-center py-20"><Loader className="animate-spin text-primary" size={48} /></div>;
  if (!project) return <div className="text-center py-20 text-text-muted text-lg">Project not found or access denied.</div>;

  const completedTasks = tasks.filter(t => t.status === 'completed').length;
  const progress = tasks.length === 0 ? 0 : Math.round((completedTasks / tasks.length) * 100);
  
  const daysRemaining = project.dueDate ? differenceInDays(new Date(project.dueDate), new Date()) : null;
  const isOverdue = project.dueDate && isPast(new Date(project.dueDate)) && project.status !== 'completed';

  return (
    <div className="pb-10">
      <button 
        onClick={() => navigate('/projects')}
        className="flex items-center gap-2 text-text-muted hover:text-primary mb-6 transition-colors"
      >
        <ArrowLeft size={16} /> Back to Projects
      </button>

      <div className="mb-8 bg-surface p-8 rounded-3xl shadow-sm border border-border relative overflow-hidden">
        {project.status === 'completed' && <div className="absolute top-0 right-0 w-32 h-32 bg-green-500/10 rounded-bl-full -z-10"></div>}
        {project.status === 'archived' && <div className="absolute top-0 right-0 w-32 h-32 bg-slate-500/10 rounded-bl-full -z-10"></div>}
        <div className="flex flex-col md:flex-row md:items-start justify-between gap-6">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <h1 className="text-3xl font-bold text-text">{project.name}</h1>
              <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider border ${
                project.status === 'completed' ? 'bg-green-100 text-green-700 border-green-200 dark:bg-green-900/30 dark:text-green-400 dark:border-green-800' :
                project.status === 'archived' ? 'bg-slate-200 text-slate-700 border-slate-300 dark:bg-slate-700 dark:text-slate-300 dark:border-slate-600' :
                'bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-900/30 dark:text-blue-400 dark:border-blue-800'
              }`}>
                {project.status || 'Active'}
              </span>
            </div>
            <p className="text-text-muted mb-6 max-w-3xl leading-relaxed">{project.description}</p>
            
            <div className="flex flex-wrap gap-4">
              <div className="bg-slate-50 dark:bg-slate-800/50 px-5 py-3 rounded-2xl border border-border flex items-center gap-4">
                <div className="h-10 w-10 bg-indigo-100 text-indigo-700 dark:bg-indigo-900/50 dark:text-indigo-400 rounded-xl flex items-center justify-center font-bold">
                  {project.admin?.name?.charAt(0).toUpperCase() || 'A'}
                </div>
                <div>
                  <span className="text-text-muted text-[10px] font-bold uppercase tracking-wider block">Project Manager</span>
                  <span className="font-bold text-text">{project.admin?.name || 'Unknown'}</span>
                </div>
              </div>
              <div className="bg-slate-50 dark:bg-slate-800/50 px-5 py-3 rounded-2xl border border-border flex items-center gap-4">
                 <div className="flex -space-x-3">
                   {project.members?.slice(0, 3).map((m, i) => (
                     <div key={i} className="h-10 w-10 bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-400 rounded-full border-2 border-surface flex items-center justify-center font-bold text-sm shadow-sm z-10 relative">
                       {m.name?.charAt(0).toUpperCase()}
                     </div>
                   ))}
                   {project.members?.length > 3 && (
                     <div className="h-10 w-10 bg-slate-200 text-slate-700 dark:bg-slate-700 dark:text-slate-300 rounded-full border-2 border-surface flex items-center justify-center font-bold text-sm shadow-sm z-0 relative">
                       +{project.members.length - 3}
                     </div>
                   )}
                 </div>
                <div>
                  <span className="text-text-muted text-[10px] font-bold uppercase tracking-wider block">Team</span>
                  <span className="font-bold text-text">{project.members?.length || 0} Members</span>
                </div>
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-4 min-w-[250px]">
            {project.dueDate && (
              <div className={`p-4 rounded-2xl border ${isOverdue ? 'bg-red-50 border-red-200 dark:bg-red-900/20 dark:border-red-800' : 'bg-slate-50 border-border dark:bg-slate-800/50'}`}>
                <div className="flex items-center gap-2 mb-1">
                  <Clock size={16} className={isOverdue ? 'text-red-500' : 'text-text-muted'} />
                  <span className="text-xs font-bold uppercase tracking-wider text-text-muted">Deadline</span>
                </div>
                <div className={`text-xl font-bold ${isOverdue ? 'text-red-600 dark:text-red-400' : 'text-text'}`}>
                  {format(new Date(project.dueDate), 'MMMM d, yyyy')}
                </div>
                <div className={`text-sm mt-1 font-medium ${isOverdue ? 'text-red-500' : 'text-primary'}`}>
                  {project.status === 'completed' ? 'Finished' : 
                   isOverdue ? `${Math.abs(daysRemaining)} days overdue` : 
                   `${daysRemaining} days remaining`}
                </div>
              </div>
            )}

            <div className="p-4 rounded-2xl border border-border bg-slate-50 dark:bg-slate-800/50">
               <div className="flex justify-between items-center text-xs font-bold uppercase tracking-wider text-text-muted mb-2">
                 <span>Progress</span>
                 <span>{progress}%</span>
               </div>
               <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-2.5 overflow-hidden mb-2">
                 <div 
                   className={`h-full rounded-full transition-all duration-1000 ease-out ${progress === 100 ? 'bg-green-500' : 'bg-primary'}`} 
                   style={{ width: `${progress}%` }}
                 ></div>
               </div>
               <div className="text-xs font-medium text-text-muted">
                 {completedTasks} of {tasks.length} tasks completed
               </div>
            </div>

            {user.role === 'admin' && (
              <div className="flex gap-2">
                {project.status !== 'completed' && (
                  <button 
                    onClick={() => handleProjectStatusChange('completed')}
                    disabled={updatingProject}
                    className="flex-1 flex justify-center items-center gap-1.5 py-2 bg-green-50 text-green-700 border border-green-200 hover:bg-green-100 dark:bg-green-900/30 dark:text-green-400 dark:border-green-800 dark:hover:bg-green-900/50 rounded-xl text-sm font-bold transition-colors"
                  >
                    <CheckCircle2 size={16} /> Complete
                  </button>
                )}
                {project.status !== 'archived' && (
                  <button 
                    onClick={() => handleProjectStatusChange('archived')}
                    disabled={updatingProject}
                    className="flex-1 flex justify-center items-center gap-1.5 py-2 bg-slate-50 text-slate-700 border border-slate-200 hover:bg-slate-100 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700 dark:hover:bg-slate-700 rounded-xl text-sm font-bold transition-colors"
                  >
                    <Archive size={16} /> Archive
                  </button>
                )}
                {project.status !== 'active' && (
                  <button 
                    onClick={() => handleProjectStatusChange('active')}
                    disabled={updatingProject}
                    className="flex-1 flex justify-center items-center gap-1.5 py-2 bg-blue-50 text-blue-700 border border-blue-200 hover:bg-blue-100 dark:bg-blue-900/30 dark:text-blue-400 dark:border-blue-800 dark:hover:bg-blue-900/50 rounded-xl text-sm font-bold transition-colors"
                  >
                    Activate
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <h2 className="text-2xl font-bold text-text flex items-center gap-2">
          <CheckSquare size={24} className="text-primary" />
          Project Tasks
        </h2>
        <button 
          onClick={handleAddTaskClick}
          className={`flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl shadow-md transition-colors ${
            user?.role === 'admin' 
              ? 'bg-primary text-white hover:bg-blue-600' 
              : 'bg-surface text-text-muted cursor-not-allowed border border-border'
          }`}
        >
          {user?.role === 'admin' ? <Plus size={20} /> : <Lock size={16} />}
          <span className="font-medium">Add Task</span>
        </button>
      </div>

      <DragDropContext onDragEnd={handleDragEnd}>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Kanban Board Columns */}
          {['pending', 'in-progress', 'completed'].map((status) => (
            <Droppable droppableId={status} key={status}>
              {(provided, snapshot) => (
                <div 
                  {...provided.droppableProps}
                  ref={provided.innerRef}
                  className={`bg-slate-50/50 dark:bg-slate-800/30 rounded-3xl p-5 border border-border h-fit min-h-[400px] transition-colors duration-200 ${snapshot.isDraggingOver ? 'bg-primary/5 ring-2 ring-primary/20 border-transparent' : ''}`}
                >
                  <h3 className="font-bold text-text mb-5 uppercase text-sm tracking-wider flex items-center justify-between pb-4 border-b border-border">
                    {status.replace('-', ' ')}
                    <span className="bg-surface text-text-muted px-2.5 py-0.5 rounded-full text-xs border border-border shadow-sm font-bold">
                      {tasks.filter((t) => t.status === status).length}
                    </span>
                  </h3>
                  <div className="space-y-4 min-h-[100px]">
                    {tasks
                      .filter((t) => t.status === status)
                      .map((task, index) => (
                        <TaskCard 
                          key={task._id} 
                          task={task} 
                          index={index}
                          onStatusChange={handleStatusChange}
                          isUpdating={updatingTaskId === task._id}
                        />
                      ))}
                    {provided.placeholder}
                    {tasks.filter((t) => t.status === status).length === 0 && !snapshot.isDraggingOver && (
                      <div className="text-center py-12 text-text-muted text-sm bg-surface/50 rounded-2xl border border-dashed border-border">
                        Drop tasks here
                      </div>
                    )}
                  </div>
                </div>
              )}
            </Droppable>
          ))}
        </div>
      </DragDropContext>

      <CreateTaskModal 
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={handleTaskCreated}
        projectId={id}
        projectMembers={project?.members}
      />
    </div>
  );
};

export default ProjectDetails;
