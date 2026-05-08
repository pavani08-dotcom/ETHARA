import React, { useState } from 'react';
import { X, MessageSquare, Paperclip, Loader, Download, Send } from 'lucide-react';
import { format } from 'date-fns';
import api from '../utils/api';
import toast from 'react-hot-toast';

const TaskDetailsModal = ({ isOpen, onClose, task, onUpdate }) => {
  const [commentText, setCommentText] = useState('');
  const [submittingComment, setSubmittingComment] = useState(false);
  const [uploadingFile, setUploadingFile] = useState(false);

  if (!isOpen || !task) return null;

  const handleAddComment = async (e) => {
    e.preventDefault();
    if (!commentText.trim()) return;

    setSubmittingComment(true);
    try {
      const res = await api.post(`/tasks/${task._id}/comments`, { text: commentText });
      onUpdate(res.data);
      setCommentText('');
      toast.success('Comment added');
    } catch (error) {
      toast.error('Failed to add comment');
    } finally {
      setSubmittingComment(false);
    }
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('file', file);

    setUploadingFile(true);
    try {
      const res = await api.post(`/tasks/${task._id}/attachments`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      onUpdate(res.data);
      toast.success('File uploaded');
    } catch (error) {
      toast.error('Failed to upload file');
    } finally {
      setUploadingFile(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
      <div className="bg-surface rounded-2xl shadow-xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh] border border-border">
        <div className="flex justify-between items-center p-6 border-b border-border bg-slate-50 dark:bg-slate-800/50">
          <div>
            <h2 className="text-2xl font-bold text-text">{task.title}</h2>
            <div className="flex items-center gap-2 mt-2">
              <span className={`text-xs px-2.5 py-1 rounded-md font-medium uppercase tracking-wider ${
                task.priority === 'high' ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' :
                task.priority === 'medium' ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400' :
                'bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-300'
              }`}>
                {task.priority} Priority
              </span>
              <span className="text-xs font-medium text-primary bg-blue-50 dark:bg-blue-900/30 px-2.5 py-1 rounded-full border border-blue-100 dark:border-blue-800">
                {task.project?.name}
              </span>
            </div>
          </div>
          <button onClick={onClose} className="text-text-muted hover:bg-slate-200 dark:hover:bg-slate-700 p-2 rounded-full transition-colors self-start">
            <X size={20} />
          </button>
        </div>

        <div className="p-6 overflow-y-auto flex-1 flex flex-col md:flex-row gap-6">
          <div className="flex-1 space-y-6">
            <div>
              <h3 className="text-sm font-semibold text-text-muted uppercase tracking-wider mb-2">Description</h3>
              <p className="text-text whitespace-pre-wrap">{task.description || 'No description provided.'}</p>
            </div>

            <div>
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-semibold text-text-muted uppercase tracking-wider">Attachments</h3>
                <label className="cursor-pointer text-sm font-medium text-primary hover:text-indigo-500 transition-colors flex items-center gap-1">
                  {uploadingFile ? <Loader size={14} className="animate-spin" /> : <Paperclip size={14} />}
                  Attach File
                  <input type="file" className="hidden" onChange={handleFileUpload} disabled={uploadingFile} />
                </label>
              </div>
              
              {task.attachments?.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {task.attachments.map((file, i) => (
                    <a key={i} href={`http://localhost:5002${file.url}`} target="_blank" rel="noopener noreferrer" className="flex items-center justify-between p-3 border border-border rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors group">
                      <div className="truncate flex-1 text-sm font-medium text-text">{file.filename}</div>
                      <Download size={16} className="text-text-muted group-hover:text-primary transition-colors shrink-0 ml-2" />
                    </a>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-text-muted italic">No attachments.</p>
              )}
            </div>

            <div>
              <h3 className="text-sm font-semibold text-text-muted uppercase tracking-wider mb-3">Comments</h3>
              <div className="space-y-4 mb-4">
                {task.comments?.length > 0 ? task.comments.map((comment, i) => (
                  <div key={i} className="flex gap-3">
                    <div className="h-8 w-8 bg-blue-100 text-blue-700 rounded-full flex items-center justify-center font-bold text-xs shrink-0">
                      {comment.user?.name?.charAt(0).toUpperCase()}
                    </div>
                    <div className="bg-slate-50 dark:bg-slate-800/50 p-3 rounded-2xl rounded-tl-none border border-border w-full">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm font-bold text-text">{comment.user?.name}</span>
                        <span className="text-xs text-text-muted">{format(new Date(comment.createdAt), 'MMM d, h:mm a')}</span>
                      </div>
                      <p className="text-sm text-text">{comment.text}</p>
                    </div>
                  </div>
                )) : (
                  <p className="text-sm text-text-muted italic">No comments yet.</p>
                )}
              </div>

              <form onSubmit={handleAddComment} className="flex gap-2">
                <input
                  type="text"
                  value={commentText}
                  onChange={(e) => setCommentText(e.target.value)}
                  placeholder="Write a comment..."
                  className="flex-1 px-4 py-2 bg-surface border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/50 text-text text-sm transition-all"
                />
                <button
                  type="submit"
                  disabled={submittingComment || !commentText.trim()}
                  className="p-2 bg-primary text-white rounded-xl shadow-md hover:bg-blue-600 transition-colors disabled:opacity-50"
                >
                  {submittingComment ? <Loader size={18} className="animate-spin" /> : <Send size={18} />}
                </button>
              </form>
            </div>
          </div>
          
          <div className="w-full md:w-64 space-y-4">
            <div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-xl border border-border">
              <h4 className="text-xs font-semibold text-text-muted uppercase tracking-wider mb-1">Status</h4>
              <span className={`inline-block px-3 py-1 rounded-full text-xs font-medium ${
                 task.status === 'completed' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' :
                 task.status === 'in-progress' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' :
                 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400'
              }`}>
                {task.status.replace('-', ' ').toUpperCase()}
              </span>
            </div>

            <div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-xl border border-border">
              <h4 className="text-xs font-semibold text-text-muted uppercase tracking-wider mb-1">Due Date</h4>
              <p className="text-sm font-medium text-text">
                {task.dueDate ? format(new Date(task.dueDate), 'MMMM d, yyyy') : 'No due date'}
              </p>
            </div>

            <div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-xl border border-border">
              <h4 className="text-xs font-semibold text-text-muted uppercase tracking-wider mb-1">Assignee</h4>
              <p className="text-sm font-medium text-text flex items-center gap-2">
                {task.assignedTo ? (
                  <>
                    <span className="inline-flex items-center justify-center h-6 w-6 rounded-full bg-slate-200 text-slate-700 text-xs font-bold">
                      {task.assignedTo.name.charAt(0).toUpperCase()}
                    </span>
                    {task.assignedTo.name}
                  </>
                ) : 'Unassigned'}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TaskDetailsModal;
