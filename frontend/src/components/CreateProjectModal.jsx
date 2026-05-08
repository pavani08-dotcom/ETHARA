import React, { useState, useEffect } from 'react';
import { X, Loader } from 'lucide-react';
import api from '../utils/api';
import toast from 'react-hot-toast';

const CreateProjectModal = ({ isOpen, onClose, onSuccess }) => {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [selectedMembers, setSelectedMembers] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (isOpen) {
      fetchUsers();
    }
  }, [isOpen]);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const res = await api.get('/auth/users');
      // Filter out admin users from the selection if needed, or allow selecting anyone
      setUsers(res.data.filter(u => u.role === 'member'));
    } catch (error) {
      toast.error('Failed to load users');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim()) {
      toast.error('Project name is required');
      return;
    }

    setSubmitting(true);
    try {
      const res = await api.post('/projects', {
        name,
        description,
        dueDate: dueDate ? new Date(dueDate).toISOString() : null,
        members: selectedMembers,
      });
      toast.success('Project created successfully!');
      onSuccess(res.data);
      handleClose();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to create project');
    } finally {
      setSubmitting(false);
    }
  };

  const handleClose = () => {
    setName('');
    setDescription('');
    setDueDate('');
    setSelectedMembers([]);
    onClose();
  };

  const toggleMember = (userId) => {
    if (selectedMembers.includes(userId)) {
      setSelectedMembers(selectedMembers.filter(id => id !== userId));
    } else {
      setSelectedMembers([...selectedMembers, userId]);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
      <div className="bg-surface rounded-2xl shadow-xl w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh] border border-border">
        <div className="flex justify-between items-center p-6 border-b border-border bg-slate-50/50 dark:bg-slate-800/50">
          <h2 className="text-xl font-bold text-text">Create New Project</h2>
          <button onClick={handleClose} className="text-text-muted hover:text-text transition-colors">
            <X size={24} />
          </button>
        </div>

        <div className="p-6 overflow-y-auto flex-1">
          <form id="create-project-form" onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-text mb-1">Project Name</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-4 py-2 bg-surface border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/50 text-text transition-all"
                placeholder="e.g. Website Redesign"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-text mb-1">Description</label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full px-4 py-2 bg-surface border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/50 text-text transition-all min-h-[100px]"
                placeholder="What is this project about?"
              ></textarea>
            </div>

            <div>
              <label className="block text-sm font-medium text-text mb-1">Deadline</label>
              <input
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="w-full px-4 py-2 bg-surface border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/50 text-text transition-all"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-text mb-2">Assign Members</label>
              {loading ? (
                <div className="flex items-center justify-center py-4 text-text-muted">
                  <Loader className="animate-spin mr-2" size={20} /> Loading users...
                </div>
              ) : (
                <div className="border border-border rounded-xl max-h-48 overflow-y-auto divide-y divide-border bg-surface">
                  {users.length === 0 ? (
                    <div className="p-4 text-sm text-text-muted text-center">No members found to assign.</div>
                  ) : (
                    users.map(user => (
                      <label key={user._id} className="flex items-center gap-3 p-3 hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer transition-colors">
                        <input
                          type="checkbox"
                          checked={selectedMembers.includes(user._id)}
                          onChange={() => toggleMember(user._id)}
                          className="w-4 h-4 text-primary bg-surface border-border rounded focus:ring-primary focus:ring-2"
                        />
                        <div className="flex flex-col">
                          <span className="text-sm font-medium text-text">{user.name}</span>
                          <span className="text-xs text-text-muted">{user.email}</span>
                        </div>
                      </label>
                    ))
                  )}
                </div>
              )}
              <p className="text-xs text-text-muted mt-2">Selected: {selectedMembers.length} members</p>
            </div>
          </form>
        </div>

        <div className="p-6 border-t border-border bg-slate-50 dark:bg-slate-800/50 flex justify-end gap-3 shrink-0">
          <button
            type="button"
            onClick={handleClose}
            className="px-4 py-2 text-text-muted font-medium hover:bg-slate-200 dark:hover:bg-slate-700 rounded-xl transition-colors"
            disabled={submitting}
          >
            Cancel
          </button>
          <button
            type="submit"
            form="create-project-form"
            className="px-6 py-2 bg-primary text-white font-medium rounded-xl shadow-md hover:bg-blue-600 transition-colors flex items-center gap-2 disabled:opacity-70"
            disabled={submitting}
          >
            {submitting && <Loader className="animate-spin" size={16} />}
            {submitting ? 'Creating...' : 'Create Project'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default CreateProjectModal;
