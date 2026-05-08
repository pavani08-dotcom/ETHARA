import React, { useState, useEffect } from 'react';
import api from '../utils/api';
import { Search, Loader, Filter } from 'lucide-react';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import toast from 'react-hot-toast';
import TaskDetailsModal from '../components/TaskDetailsModal';
import { format, isPast, isToday } from 'date-fns';

const Tasks = () => {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterPriority, setFilterPriority] = useState('all');
  const [selectedTask, setSelectedTask] = useState(null);

  useEffect(() => {
    fetchTasks();
  }, []);

  const fetchTasks = async () => {
    try {
      const res = await api.get('/tasks');
      setTasks(res.data);
    } catch (error) {
      toast.error('Failed to fetch tasks');
    } finally {
      setLoading(false);
    }
  };

  const handleDragEnd = async (result) => {
    const { destination, source, draggableId } = result;
    if (!destination) return;
    if (destination.droppableId === source.droppableId && destination.index === source.index) return;

    const newStatus = destination.droppableId;
    
    // Optimistic UI update
    setTasks(prev => prev.map(t => t._id === draggableId ? { ...t, status: newStatus } : t));

    try {
      await api.put(`/tasks/${draggableId}/status`, { status: newStatus });
      toast.success('Task status updated');
    } catch (error) {
      toast.error('Failed to update task status');
      fetchTasks(); // Revert on failure
    }
  };

  const filteredTasks = tasks.filter(task => {
    const matchesSearch = task.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          (task.description && task.description.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesPriority = filterPriority === 'all' || task.priority === filterPriority;
    return matchesSearch && matchesPriority;
  });

  const columns = {
    pending: { title: 'To Do', items: filteredTasks.filter(t => t.status === 'pending') },
    'in-progress': { title: 'In Progress', items: filteredTasks.filter(t => t.status === 'in-progress') },
    completed: { title: 'Completed', items: filteredTasks.filter(t => t.status === 'completed') }
  };

  if (loading) return <div className="flex justify-center py-20"><Loader className="animate-spin text-primary" size={48} /></div>;

  return (
    <div className="flex flex-col h-full">
      <div className="mb-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-text">Kanban Board</h1>
          <p className="text-text-muted">Drag and drop to update status</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input 
              type="text" 
              placeholder="Search tasks..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-4 py-2 bg-surface border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/50 text-sm w-full md:w-64 text-text transition-all shadow-sm"
            />
          </div>
          <div className="relative">
            <Filter className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <select 
              value={filterPriority}
              onChange={(e) => setFilterPriority(e.target.value)}
              className="pl-10 pr-8 py-2 bg-surface border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/50 text-sm text-text appearance-none transition-all shadow-sm cursor-pointer"
            >
              <option value="all">All Priorities</option>
              <option value="high">High</option>
              <option value="medium">Medium</option>
              <option value="low">Low</option>
            </select>
          </div>
        </div>
      </div>

      <DragDropContext onDragEnd={handleDragEnd}>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 flex-1 items-start min-h-[500px] overflow-x-auto pb-4">
          {Object.entries(columns).map(([columnId, column]) => (
            <div key={columnId} className="bg-slate-50/50 dark:bg-slate-800/30 p-4 rounded-2xl border border-border flex flex-col h-full min-w-[280px]">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-bold text-text">{column.title}</h3>
                <span className="bg-slate-200 dark:bg-slate-700 text-text-muted text-xs font-bold px-2 py-1 rounded-full">
                  {column.items.length}
                </span>
              </div>

              <Droppable droppableId={columnId}>
                {(provided, snapshot) => (
                  <div 
                    {...provided.droppableProps} 
                    ref={provided.innerRef}
                    className={`flex-1 space-y-3 min-h-[150px] p-1 rounded-xl transition-colors ${snapshot.isDraggingOver ? 'bg-primary/5 border border-primary/20 border-dashed' : ''}`}
                  >
                    {column.items.map((task, index) => {
                      const isOverdue = task.dueDate && isPast(new Date(task.dueDate)) && task.status !== 'completed' && !isToday(new Date(task.dueDate));
                      return (
                        <Draggable key={task._id} draggableId={task._id} index={index}>
                          {(provided, snapshot) => (
                            <div
                              ref={provided.innerRef}
                              {...provided.draggableProps}
                              {...provided.dragHandleProps}
                              onClick={() => setSelectedTask(task)}
                              className={`bg-surface p-4 rounded-xl border transition-all cursor-pointer group ${snapshot.isDragging ? 'shadow-2xl border-primary/50 rotate-2' : 'shadow-sm border-border hover:border-primary/30 hover:shadow-md'}`}
                            >
                              <div className="flex items-start justify-between mb-2">
                                <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md ${
                                  task.priority === 'high' ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' :
                                  task.priority === 'medium' ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400' :
                                  'bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-300'
                                }`}>
                                  {task.priority}
                                </span>
                                {task.project && (
                                  <span className="text-[10px] font-bold text-primary bg-blue-50 dark:bg-blue-900/30 px-2 py-0.5 rounded-md truncate max-w-[100px]">
                                    {task.project.name}
                                  </span>
                                )}
                              </div>
                              <h4 className="font-bold text-text text-sm mb-1 group-hover:text-primary transition-colors">{task.title}</h4>
                              {task.dueDate && (
                                <p className={`text-xs mt-3 font-medium flex items-center gap-1 ${isOverdue ? 'text-red-500' : 'text-text-muted'}`}>
                                  {isOverdue ? '⚠️ Overdue' : format(new Date(task.dueDate), 'MMM d')}
                                </p>
                              )}
                            </div>
                          )}
                        </Draggable>
                      );
                    })}
                    {provided.placeholder}
                  </div>
                )}
              </Droppable>
            </div>
          ))}
        </div>
      </DragDropContext>

      {selectedTask && (
        <TaskDetailsModal 
          isOpen={!!selectedTask} 
          onClose={() => setSelectedTask(null)} 
          task={selectedTask}
          onUpdate={(updatedTask) => {
            setTasks(prev => prev.map(t => t._id === updatedTask._id ? updatedTask : t));
            setSelectedTask(updatedTask);
          }}
        />
      )}
    </div>
  );
};

export default Tasks;
