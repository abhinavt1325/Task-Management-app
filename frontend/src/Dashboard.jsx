import React, { useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  CheckCircle2, Circle, Edit2, Trash2, 
  Plus, LogOut, CheckSquare, Loader2, X 
} from 'lucide-react';
import api from './api';
import { AuthContext } from './AuthContext';
import './Dashboard.css';

export default function Dashboard() {
  const { user, logout } = useContext(AuthContext);
  const navigate = useNavigate();
  
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState(null);
  const [formData, setFormData] = useState({ title: '', description: '', is_completed: false });
  const [modalLoading, setModalLoading] = useState(false);

  // Fetch tasks on component mount
  useEffect(() => {
    fetchTasks();
  }, []);

  const fetchTasks = async () => {
    try {
      const response = await api.get('/tasks/all_tasks');
      setTasks(response.data);
    } catch (error) {
      console.error('Error fetching tasks', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const openModal = (task = null) => {
    if (task) {
      setEditingTask(task);
      setFormData({ 
        title: task.title, 
        description: task.description, 
        is_completed: task.is_completed 
      });
    } else {
      setEditingTask(null);
      setFormData({ title: '', description: '', is_completed: false });
    }
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingTask(null);
  };

  const handleSubmitTask = async (e) => {
    e.preventDefault();
    setModalLoading(true);
    try {
      if (editingTask) {
        // Update existing task
        await api.put(`/tasks/update_task/${editingTask.id}`, formData);
      } else {
        // Create new task
        await api.post('/tasks/create', formData);
      }
      await fetchTasks(); // Refresh list
      closeModal();
    } catch (error) {
      console.error('Error saving task', error);
      alert('Failed to save task.');
    } finally {
      setModalLoading(false);
    }
  };

  const toggleTaskCompletion = async (task) => {
    try {
      const updatedData = {
        title: task.title,
        description: task.description,
        is_completed: !task.is_completed
      };
      await api.put(`/tasks/update_task/${task.id}`, updatedData);
      
      // Update local state for immediate feedback
      setTasks(tasks.map(t => t.id === task.id ? { ...t, is_completed: !t.is_completed } : t));
    } catch (error) {
      console.error('Error toggling completion', error);
    }
  };

  const deleteTask = async (taskId) => {
    if (!window.confirm('Are you sure you want to delete this task?')) return;
    
    try {
      await api.delete(`/tasks/delete_task/${taskId}`);
      setTasks(tasks.filter(t => t.id !== taskId));
    } catch (error) {
      console.error('Error deleting task', error);
    }
  };

  if (loading) {
    return (
      <div className="dashboard-layout">
        <div className="loader-container">
          <Loader2 className="animate-spin" size={48} />
        </div>
      </div>
    );
  }

  return (
    <div className="dashboard-layout animate-fade-in">
      {/* Navbar */}
      <nav className="navbar">
        <div className="container navbar-container">
          <div className="nav-brand">
            <CheckSquare className="nav-brand-icon" size={28} />
            <span>TaskFlow</span>
          </div>
          <div className="nav-actions">
            <span className="user-greeting">Hi, {user?.name || 'User'}</span>
            <button onClick={handleLogout} className="btn-logout">
              <LogOut size={18} /> Logout
            </button>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="container dashboard-content">
        <div className="dashboard-header">
          <h1 className="title-medium">Your Tasks</h1>
          <button onClick={() => openModal()} className="btn-primary">
            <Plus size={20} /> New Task
          </button>
        </div>

        {tasks.length === 0 ? (
          <div className="empty-state">
            <CheckCircle2 size={64} style={{ opacity: 0.2 }} />
            <h2 className="title-medium">No tasks yet</h2>
            <p>Create your first task to get started.</p>
          </div>
        ) : (
          <div className="tasks-grid">
            {tasks.map(task => (
              <div key={task.id} className={`task-card ${task.is_completed ? 'completed' : ''}`}>
                <div className="task-header">
                  <h3 className="task-title">{task.title}</h3>
                </div>
                <p className="task-desc">{task.description}</p>
                
                <div className="task-actions">
                  <button 
                    onClick={() => toggleTaskCompletion(task)} 
                    className="btn-icon complete"
                    title={task.is_completed ? "Mark incomplete" : "Mark complete"}
                  >
                    {task.is_completed ? <CheckCircle2 size={20} /> : <Circle size={20} />}
                  </button>
                  <button 
                    onClick={() => openModal(task)} 
                    className="btn-icon"
                    title="Edit task"
                  >
                    <Edit2 size={18} />
                  </button>
                  <button 
                    onClick={() => deleteTask(task.id)} 
                    className="btn-icon delete"
                    title="Delete task"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {/* Task Modal */}
      {isModalOpen && (
        <div className="modal-overlay">
          <div className="modal-content animate-fade-in">
            <div className="modal-header">
              <h2>{editingTask ? 'Edit Task' : 'Create Task'}</h2>
              <button onClick={closeModal} className="btn-close">
                <X size={24} />
              </button>
            </div>
            <form onSubmit={handleSubmitTask}>
              <div className="form-group">
                <label htmlFor="title">Task Title</label>
                <input
                  id="title"
                  type="text"
                  className="form-control"
                  placeholder="E.g., Complete project proposal"
                  value={formData.title}
                  onChange={(e) => setFormData({...formData, title: e.target.value})}
                  required
                />
              </div>
              <div className="form-group">
                <label htmlFor="description">Description</label>
                <textarea
                  id="description"
                  className="form-control"
                  placeholder="Add details about your task..."
                  value={formData.description}
                  onChange={(e) => setFormData({...formData, description: e.target.value})}
                  required
                />
              </div>
              <div className="modal-actions">
                <button type="button" onClick={closeModal} className="btn-secondary">
                  Cancel
                </button>
                <button type="submit" className="btn-primary" disabled={modalLoading}>
                  {modalLoading ? <Loader2 className="animate-spin" size={20} /> : 'Save Task'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
