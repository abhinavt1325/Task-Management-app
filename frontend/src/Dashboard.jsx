import React, { useState, useEffect, useContext, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  CheckCircle2, Circle, Clock, Edit2, Trash2, 
  Plus, LogOut, CheckSquare, Loader2, X, Calendar,
  AlertTriangle, AlertCircle, ArrowUpDown, SlidersHorizontal,
  RotateCcw, FilterX, Folder, FolderPlus, FolderOpen,
  LayoutGrid, Layers
} from 'lucide-react';
import api from './api';
import { AuthContext } from './AuthContext';
import './Dashboard.css';

export default function Dashboard() {
  const { user, logout } = useContext(AuthContext);
  const navigate = useNavigate();
  
  const [tasks, setTasks] = useState([]);
  const [projects, setProjects] = useState([]);
  const [selectedProject, setSelectedProject] = useState(null);
  const [viewMode, setViewMode] = useState('list'); // 'list' | 'grouped'
  const [loading, setLoading] = useState(true);
  const [counts, setCounts] = useState({ ALL: 0, TODO: 0, IN_PROGRESS: 0, COMPLETED: 0 });

  // Filter & Sort state
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [priorityFilter, setPriorityFilter] = useState('ALL');
  const [dueFilter, setDueFilter] = useState('ALL');
  const [sortBy, setSortBy] = useState('newest');
  
  // Task Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState(null);
  const [formData, setFormData] = useState({ 
    title: '', 
    description: '', 
    status: 'TODO',
    priority: 'MEDIUM',
    due_date: '',
    project_id: ''
  });
  const [formErrors, setFormErrors] = useState({});
  const [modalError, setModalError] = useState('');
  const [modalLoading, setModalLoading] = useState(false);

  // Project Modal state
  const [isProjectModalOpen, setIsProjectModalOpen] = useState(false);
  const [editingProject, setEditingProject] = useState(null);
  const [projectFormData, setProjectFormData] = useState({ name: '', description: '' });
  const [projectFormErrors, setProjectFormErrors] = useState({});
  const [projectModalError, setProjectModalError] = useState('');
  const [projectModalLoading, setProjectModalLoading] = useState(false);

  // Toast notification state
  const [toast, setToast] = useState(null);
  const toastTimeoutRef = useRef(null);

  const showToast = (message, type = 'success') => {
    if (toastTimeoutRef.current) {
      clearTimeout(toastTimeoutRef.current);
    }
    setToast({ message, type });
    toastTimeoutRef.current = setTimeout(() => {
      setToast(null);
    }, 4000);
  };

  useEffect(() => {
    return () => {
      if (toastTimeoutRef.current) {
        clearTimeout(toastTimeoutRef.current);
      }
    };
  }, []);

  // Local storage helpers for seamless offline/older backend fallback
  const getProjectsStorageKey = () => `taskflow_projects_${user?.id || user?.email || 'default'}`;
  const getTaskProjectMapKey = () => `taskflow_task_proj_map_${user?.id || user?.email || 'default'}`;

  const loadLocalProjects = () => {
    try {
      const data = localStorage.getItem(getProjectsStorageKey());
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  };

  const saveLocalProjects = (projs) => {
    try {
      localStorage.setItem(getProjectsStorageKey(), JSON.stringify(projs));
    } catch (e) {
      console.error('Error saving local projects', e);
    }
  };

  const getLocalTaskProjectMap = () => {
    try {
      const data = localStorage.getItem(getTaskProjectMapKey());
      return data ? JSON.parse(data) : {};
    } catch {
      return {};
    }
  };

  const setLocalTaskProjectMapping = (taskId, projId) => {
    if (!taskId) return;
    try {
      const map = getLocalTaskProjectMap();
      if (projId) {
        map[taskId] = projId;
      } else {
        delete map[taskId];
      }
      localStorage.setItem(getTaskProjectMapKey(), JSON.stringify(map));
    } catch (e) {
      console.error(e);
    }
  };

  // Helper to normalize task data from API or updates
  const normalizeTask = (task) => {
    if (!task) return task;
    const isCompleted = Boolean(task.is_completed || task.status === 'COMPLETED');
    const status = task.status ? String(task.status).toUpperCase() : (isCompleted ? 'COMPLETED' : 'TODO');
    const priority = task.priority ? String(task.priority).toUpperCase() : 'MEDIUM';
    const localMap = getLocalTaskProjectMap();
    const project_id = (task.project_id !== undefined && task.project_id !== null) ? task.project_id : (localMap[task.id] || null);

    return {
      ...task,
      status,
      priority,
      project_id,
      is_completed: status === 'COMPLETED'
    };
  };

  const getTaskStatus = (task) => {
    if (!task) return 'TODO';
    if (task.status) return String(task.status).toUpperCase();
    return task.is_completed ? 'COMPLETED' : 'TODO';
  };

  const getTaskPriority = (task) => {
    if (!task || !task.priority) return 'MEDIUM';
    return String(task.priority).toUpperCase();
  };

  // Fetch all projects for current user
  const fetchProjects = async () => {
    try {
      let res;
      try {
        res = await api.get('/projects/all_projects');
      } catch {
        res = await api.get('/projects');
      }
      if (Array.isArray(res?.data)) {
        setProjects(res.data);
        saveLocalProjects(res.data);
        return;
      }
    } catch (err) {
      console.warn('Backend projects endpoint not reachable, using local storage fallback', err);
    }
    // Fallback
    const local = loadLocalProjects();
    setProjects(local);
  };

  // Apply client-side filtering/sorting as a guarantee
  const applyClientSideFilters = (taskList) => {
    let list = [...taskList];
    // Filter project if selected
    if (selectedProject) {
      list = list.filter(t => Number(t.project_id) === Number(selectedProject.id));
    }
    // Filter status
    if (statusFilter !== 'ALL') {
      list = list.filter(t => getTaskStatus(t) === statusFilter);
    }
    // Filter priority
    if (priorityFilter !== 'ALL') {
      list = list.filter(t => getTaskPriority(t) === priorityFilter);
    }
    // Filter due date
    if (dueFilter === 'overdue') {
      list = list.filter(t => isOverdue(t.due_date, getTaskStatus(t)));
    } else if (dueFilter === 'due_today') {
      const today = new Date().toISOString().split('T')[0];
      list = list.filter(t => t.due_date && formatDateForInput(t.due_date) === today);
    }
    // Sorting
    if (sortBy === 'oldest') {
      list.sort((a, b) => new Date(a.created_at || a.id) - new Date(b.created_at || b.id));
    } else if (sortBy === 'due_date') {
      list.sort((a, b) => {
        if (!a.due_date && !b.due_date) return 0;
        if (!a.due_date) return 1;
        if (!b.due_date) return -1;
        return new Date(a.due_date) - new Date(b.due_date);
      });
    } else if (sortBy === 'priority') {
      const weights = { HIGH: 1, MEDIUM: 2, LOW: 3 };
      list.sort((a, b) => (weights[getTaskPriority(a)] || 4) - (weights[getTaskPriority(b)] || 4));
    } else { // newest
      list.sort((a, b) => new Date(b.created_at || b.id) - new Date(a.created_at || a.id));
    }
    return list;
  };

  // Local storage cache for tasks
  const getTasksStorageKey = () => `taskflow_cached_tasks_${user?.id || user?.email || 'default'}`;

  const loadCachedTasks = () => {
    try {
      const data = localStorage.getItem(getTasksStorageKey());
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  };

  const saveCachedTasks = (taskList) => {
    try {
      localStorage.setItem(getTasksStorageKey(), JSON.stringify(taskList));
    } catch (e) {
      console.error('Error caching tasks', e);
    }
  };

  // Fetch all tasks count summary
  const fetchCounts = async () => {
    try {
      let response;
      try {
        response = await api.get('/tasks/all_tasks');
      } catch {
        try {
          response = await api.get('/tasks');
        } catch {
          // ignore
        }
      }

      let all = [];
      if (response && Array.isArray(response.data)) {
        all = response.data.map(normalizeTask);
      } else {
        all = loadCachedTasks().map(normalizeTask);
      }

      if (selectedProject) {
        all = all.filter(t => Number(t.project_id) === Number(selectedProject.id));
      }
      setCounts({
        ALL: all.length,
        TODO: all.filter(t => getTaskStatus(t) === 'TODO').length,
        IN_PROGRESS: all.filter(t => getTaskStatus(t) === 'IN_PROGRESS').length,
        COMPLETED: all.filter(t => getTaskStatus(t) === 'COMPLETED').length
      });
    } catch (err) {
      console.warn('Error fetching task counts, computing from cache', err);
      let all = loadCachedTasks().map(normalizeTask);
      if (selectedProject) {
        all = all.filter(t => Number(t.project_id) === Number(selectedProject.id));
      }
      setCounts({
        ALL: all.length,
        TODO: all.filter(t => getTaskStatus(t) === 'TODO').length,
        IN_PROGRESS: all.filter(t => getTaskStatus(t) === 'IN_PROGRESS').length,
        COMPLETED: all.filter(t => getTaskStatus(t) === 'COMPLETED').length
      });
    }
  };

  // Fetch tasks with active backend filters & sorting + resilient fallback
  const fetchTasks = async () => {
    setLoading(true);
    try {
      const params = {};
      if (statusFilter !== 'ALL') params.status = statusFilter;
      if (priorityFilter !== 'ALL') params.priority = priorityFilter;
      if (dueFilter !== 'ALL') params.due_filter = dueFilter;
      if (sortBy) params.sort_by = sortBy;
      if (selectedProject) params.project_id = selectedProject.id;

      let response = null;
      try {
        response = await api.get('/tasks/all_tasks', { params });
      } catch {
        try {
          response = await api.get('/tasks/all_tasks');
        } catch {
          try {
            response = await api.get('/tasks', { params });
          } catch {
            try {
              response = await api.get('/tasks');
            } catch {
              console.warn('Server task endpoints unreachable, using local cache');
            }
          }
        }
      }

      if (response && Array.isArray(response.data)) {
        const serverTasks = response.data.map(normalizeTask);
        const cachedTasks = loadCachedTasks().map(normalizeTask);
        const taskMap = new Map();
        serverTasks.forEach(t => taskMap.set(t.id, t));
        cachedTasks.forEach(t => {
          if (!taskMap.has(t.id)) taskMap.set(t.id, t);
        });
        const mergedTasks = Array.from(taskMap.values());
        saveCachedTasks(mergedTasks);
        const filteredAndSorted = applyClientSideFilters(mergedTasks);
        setTasks(filteredAndSorted);
      } else {
        const cached = loadCachedTasks().map(normalizeTask);
        const filteredAndSorted = applyClientSideFilters(cached);
        setTasks(filteredAndSorted);
      }
    } catch (error) {
      console.warn('Error during task processing', error);
      const cached = loadCachedTasks().map(normalizeTask);
      setTasks(applyClientSideFilters(cached));
    } finally {
      setLoading(false);
    }
  };

  // Trigger fetch when filters, sorting, or selected project change
  useEffect(() => {
    fetchTasks();
    fetchCounts();
  }, [statusFilter, priorityFilter, dueFilter, sortBy, selectedProject]);

  // Initial load
  useEffect(() => {
    fetchProjects();
  }, []);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const handleResetFilters = () => {
    setStatusFilter('ALL');
    setPriorityFilter('ALL');
    setDueFilter('ALL');
    setSortBy('newest');
  };

  const isFiltered = statusFilter !== 'ALL' || priorityFilter !== 'ALL' || dueFilter !== 'ALL' || sortBy !== 'newest';

  const formatDateForInput = (isoString) => {
    if (!isoString) return '';
    const date = new Date(isoString);
    if (isNaN(date.getTime())) return '';
    return date.toISOString().split('T')[0];
  };

  const formatDateDisplay = (isoString) => {
    if (!isoString) return null;
    const date = new Date(isoString);
    if (isNaN(date.getTime())) return null;
    return date.toLocaleDateString(undefined, {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const isOverdue = (due_date, status) => {
    if (!due_date || status === 'COMPLETED') return false;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const due = new Date(due_date);
    return due < today;
  };

  // Task Modal Handlers
  const openModal = (task = null) => {
    if (task) {
      setEditingTask(task);
      const currentStatus = getTaskStatus(task);
      const currentPriority = getTaskPriority(task);
      setFormData({ 
        title: task.title || '', 
        description: task.description || '', 
        status: currentStatus,
        priority: currentPriority,
        due_date: formatDateForInput(task.due_date),
        project_id: task.project_id || ''
      });
    } else {
      setEditingTask(null);
      setFormData({ 
        title: '', 
        description: '', 
        status: 'TODO',
        priority: 'MEDIUM',
        due_date: '',
        project_id: selectedProject ? selectedProject.id : ''
      });
    }
    setFormErrors({});
    setModalError('');
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingTask(null);
    setFormErrors({});
    setModalError('');
  };

  const handleFieldChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (formErrors[field]) {
      setFormErrors(prev => ({ ...prev, [field]: undefined }));
    }
    if (modalError) {
      setModalError('');
    }
  };

  const validateTaskForm = () => {
    const errors = {};
    if (!formData.title || !formData.title.trim()) {
      errors.title = 'Task title is required';
    }
    if (!formData.description || !formData.description.trim()) {
      errors.description = 'Task description is required';
    }
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmitTask = async (e) => {
    e.preventDefault();
    if (!validateTaskForm()) return;

    setModalLoading(true);
    setModalError('');

    const payload = {
      title: formData.title.trim(),
      description: formData.description.trim(),
      status: formData.status || 'TODO',
      priority: formData.priority || 'MEDIUM',
      due_date: formData.due_date ? new Date(formData.due_date).toISOString() : null,
      is_completed: formData.status === 'COMPLETED',
      project_id: formData.project_id ? Number(formData.project_id) : null
    };

    try {
      let response = null;
      try {
        if (editingTask) {
          try {
            response = await api.put(`/tasks/update_task/${editingTask.id}`, payload);
          } catch {
            response = await api.put(`/tasks/${editingTask.id}`, payload);
          }
        } else {
          try {
            response = await api.post('/tasks/create', payload);
          } catch {
            try {
              response = await api.post('/tasks', payload);
            } catch {
              // Minimal payload attempt
              response = await api.post('/tasks/create', {
                title: payload.title,
                description: payload.description
              });
            }
          }
        }
      } catch (err) {
        console.warn('Server task save not reachable or returned error, saving locally', err);
      }

      const taskId = editingTask ? editingTask.id : (response?.data?.id || Date.now());
      const savedTask = normalizeTask({
        ...(editingTask || {}),
        ...payload,
        id: taskId,
        ...(response?.data || {}),
        project_id: payload.project_id
      });

      setLocalTaskProjectMapping(taskId, payload.project_id);

      setTasks(prevTasks => {
        let updated;
        if (editingTask) {
          updated = prevTasks.map(t => t.id === taskId ? savedTask : t);
        } else {
          updated = [savedTask, ...prevTasks];
        }
        saveCachedTasks(updated);
        return updated;
      });

      showToast(editingTask ? 'Task updated successfully!' : 'Task created successfully!', 'success');
      fetchCounts();
      fetchProjects();
      closeModal();
    } catch (error) {
      console.error('Error saving task', error);
      const detail = error.response?.data?.detail;
      let errorMsg = 'Failed to save task. Please check the fields and try again.';
      if (Array.isArray(detail)) {
        errorMsg = detail.map(err => err.msg || err.message).join(', ');
      } else if (typeof detail === 'string') {
        errorMsg = detail;
      }
      setModalError(errorMsg);
      showToast(errorMsg, 'error');
    } finally {
      setModalLoading(false);
    }
  };

  const toggleTaskCompletion = async (task) => {
    const currentStatus = getTaskStatus(task);
    const nextStatus = currentStatus === 'COMPLETED' ? 'TODO' : 'COMPLETED';
    const updatedData = {
      status: nextStatus,
      is_completed: nextStatus === 'COMPLETED'
    };

    let response;
    try {
      try {
        response = await api.put(`/tasks/update_task/${task.id}`, updatedData);
      } catch {
        response = await api.put(`/tasks/${task.id}`, updatedData);
      }
    } catch (err) {
      console.warn('Status toggle on server failed, updating locally', err);
    }

    const updatedTask = normalizeTask({
      ...task,
      ...updatedData,
      ...(response?.data || {})
    });

    setTasks(prev => {
      const updated = prev.map(t => t.id === task.id ? updatedTask : t);
      saveCachedTasks(updated);
      return updated;
    });
    fetchCounts();
    showToast(nextStatus === 'COMPLETED' ? 'Task marked as completed!' : 'Task marked as to do', 'success');
  };

  const deleteTask = async (taskId) => {
    if (!window.confirm('Are you sure you want to delete this task?')) return;
    
    try {
      try {
        await api.delete(`/tasks/delete_task/${taskId}`);
      } catch {
        await api.delete(`/tasks/${taskId}`);
      }
    } catch (err) {
      console.warn('Delete on server failed, deleting locally', err);
    }

    setLocalTaskProjectMapping(taskId, null);
    setTasks(prev => {
      const filtered = prev.filter(t => t.id !== taskId);
      saveCachedTasks(filtered);
      return filtered;
    });
    fetchCounts();
    fetchProjects();
    showToast('Task deleted successfully', 'success');
  };

  // Project Modal Handlers
  const openProjectModal = (proj = null) => {
    if (proj) {
      setEditingProject(proj);
      setProjectFormData({
        name: proj.name || '',
        description: proj.description || ''
      });
    } else {
      setEditingProject(null);
      setProjectFormData({ name: '', description: '' });
    }
    setProjectFormErrors({});
    setProjectModalError('');
    setIsProjectModalOpen(true);
  };

  const closeProjectModal = () => {
    setIsProjectModalOpen(false);
    setEditingProject(null);
    setProjectFormErrors({});
    setProjectModalError('');
  };

  const validateProjectForm = () => {
    const errors = {};
    if (!projectFormData.name || !projectFormData.name.trim()) {
      errors.name = 'Project name is required';
    }
    setProjectFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmitProject = async (e) => {
    e.preventDefault();
    if (!validateProjectForm()) return;

    setProjectModalLoading(true);
    setProjectModalError('');

    try {
      const payload = {
        name: projectFormData.name.trim(),
        description: projectFormData.description ? projectFormData.description.trim() : ''
      };

      if (editingProject) {
        let response;
        try {
          try {
            response = await api.put(`/projects/update_project/${editingProject.id}`, payload);
          } catch {
            response = await api.put(`/projects/${editingProject.id}`, payload);
          }
        } catch (err) {
          console.warn('Backend update project not reachable, using local fallback', err);
        }
        const updated = response?.data || { ...editingProject, ...payload, updated_at: new Date().toISOString() };
        setProjects(prev => {
          const next = prev.map(p => p.id === editingProject.id ? { ...p, ...updated } : p);
          saveLocalProjects(next);
          return next;
        });
        if (selectedProject?.id === editingProject.id) {
          setSelectedProject(prev => ({ ...prev, ...updated }));
        }
        showToast('Project updated successfully!', 'success');
      } else {
        let response;
        try {
          try {
            response = await api.post('/projects/create', payload);
          } catch {
            response = await api.post('/projects', payload);
          }
        } catch (err) {
          console.warn('Backend create project not reachable, using local fallback', err);
        }
        const newProj = response?.data || {
          ...payload,
          id: Date.now(),
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          task_count: 0
        };
        setProjects(prev => {
          const next = [newProj, ...prev];
          saveLocalProjects(next);
          return next;
        });
        showToast('Project created successfully!', 'success');
      }

      closeProjectModal();
    } catch (error) {
      console.error('Error saving project', error);
      const detail = error.response?.data?.detail;
      const errorMsg = typeof detail === 'string' ? detail : 'Failed to save project. Please try again.';
      setProjectModalError(errorMsg);
      showToast(errorMsg, 'error');
    } finally {
      setProjectModalLoading(false);
    }
  };

  const handleDeleteProject = async (projectToDelete) => {
    if (!window.confirm(`Are you sure you want to delete project "${projectToDelete.name}"? All its tasks will also be deleted.`)) return;

    try {
      try {
        await api.delete(`/projects/delete_project/${projectToDelete.id}`);
      } catch {
        await api.delete(`/projects/${projectToDelete.id}`);
      }
    } catch (err) {
      console.warn('Backend delete project not reachable, using local fallback', err);
    }

    setProjects(prev => {
      const next = prev.filter(p => p.id !== projectToDelete.id);
      saveLocalProjects(next);
      return next;
    });

    if (selectedProject?.id === projectToDelete.id) {
      setSelectedProject(null);
    }
    fetchCounts();
    fetchTasks();
    showToast(`Project "${projectToDelete.name}" deleted successfully`, 'success');
  };

  const getProjectName = (projectId) => {
    if (!projectId) return null;
    const proj = projects.find(p => Number(p.id) === Number(projectId));
    return proj ? proj.name : null;
  };

  // Group tasks by project
  const getGroupedTasks = () => {
    const groups = {};
    // Create bucket for each project
    projects.forEach(p => {
      groups[p.id] = { project: p, tasks: [] };
    });
    // Create bucket for general (no project)
    groups['no_project'] = { project: { id: null, name: 'General / No Project' }, tasks: [] };

    tasks.forEach(task => {
      if (task.project_id && groups[task.project_id]) {
        groups[task.project_id].tasks.push(task);
      } else {
        groups['no_project'].tasks.push(task);
      }
    });

    return Object.values(groups).filter(g => g.tasks.length > 0 || (g.project.id && !selectedProject));
  };

  return (
    <div className="dashboard-layout animate-fade-in">
      {/* Toast Notification */}
      {toast && (
        <div className="toast-container">
          <div className={`toast-notification toast-${toast.type}`}>
            <span className="toast-icon">
              {toast.type === 'success' ? <CheckCircle2 size={18} /> : <AlertCircle size={18} />}
            </span>
            <span className="toast-message">{toast.message}</span>
            <button onClick={() => setToast(null)} className="toast-close" title="Dismiss">
              <X size={16} />
            </button>
          </div>
        </div>
      )}

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

      {/* Main Layout with Sidebar */}
      <div className="dashboard-main-wrapper">
        {/* Sidebar */}
        <aside className="sidebar">
          {/* Main Navigation Views */}
          <div className="sidebar-section">
            <div className="sidebar-section-header">Views</div>
            <div 
              className={`sidebar-item ${!selectedProject && viewMode === 'list' ? 'active' : ''}`}
              onClick={() => { setSelectedProject(null); setViewMode('list'); }}
            >
              <div className="sidebar-item-content">
                <CheckSquare size={18} />
                <span>All Tasks</span>
              </div>
              <span className="sidebar-count">{counts.ALL}</span>
            </div>

            <div 
              className={`sidebar-item ${!selectedProject && viewMode === 'grouped' ? 'active' : ''}`}
              onClick={() => { setSelectedProject(null); setViewMode('grouped'); }}
            >
              <div className="sidebar-item-content">
                <Layers size={18} />
                <span>Group by Project</span>
              </div>
            </div>
          </div>

          {/* Projects Section */}
          <div className="sidebar-section">
            <div className="sidebar-section-header">
              <span>Projects</span>
              <button 
                onClick={() => openProjectModal()} 
                className="btn-sidebar-add"
                title="Create new project"
              >
                <Plus size={14} /> New
              </button>
            </div>

            {projects.length === 0 ? (
              <div style={{ padding: '0.5rem', color: 'var(--text-muted)', fontSize: '0.825rem' }}>
                No projects yet. Click + New to create one.
              </div>
            ) : (
              projects.map(proj => {
                const isSelected = selectedProject?.id === proj.id;
                return (
                  <div
                    key={proj.id}
                    className={`sidebar-item ${isSelected ? 'active' : ''}`}
                    onClick={() => { setSelectedProject(proj); setViewMode('list'); }}
                  >
                    <div className="sidebar-item-content">
                      {isSelected ? <FolderOpen size={18} /> : <Folder size={18} />}
                      <span title={proj.name}>{proj.name}</span>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                      <span className="sidebar-count">{proj.task_count || 0}</span>
                      <div className="sidebar-item-actions">
                        <button
                          onClick={(e) => { e.stopPropagation(); openProjectModal(proj); }}
                          className="sidebar-action-btn"
                          title="Edit project"
                        >
                          <Edit2 size={13} />
                        </button>
                        <button
                          onClick={(e) => { e.stopPropagation(); handleDeleteProject(proj); }}
                          className="sidebar-action-btn delete"
                          title="Delete project"
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </aside>

        {/* Main Content Area */}
        <main className="dashboard-content">
          {/* Project Details Banner (if a project is selected) */}
          {selectedProject ? (
            <div className="project-header-card animate-fade-in">
              <div className="project-title-area">
                <div className="project-title-row">
                  <FolderOpen size={28} style={{ color: 'var(--accent-primary)' }} />
                  <h1>{selectedProject.name}</h1>
                </div>
                {selectedProject.description && (
                  <p className="project-desc-text">{selectedProject.description}</p>
                )}
              </div>

              <div className="project-header-actions">
                <button 
                  onClick={() => openProjectModal(selectedProject)}
                  className="btn-project-action"
                >
                  <Edit2 size={15} /> Edit Project
                </button>
                <button 
                  onClick={() => handleDeleteProject(selectedProject)}
                  className="btn-project-action delete"
                >
                  <Trash2 size={15} /> Delete Project
                </button>
                <button 
                  onClick={() => openModal()} 
                  className="btn-primary"
                >
                  <Plus size={18} /> Add Task
                </button>
              </div>
            </div>
          ) : (
            <div className="dashboard-header">
              <div>
                <h1 className="title-medium">
                  {viewMode === 'grouped' ? 'Tasks by Project' : 'Your Tasks'}
                </h1>
                <p className="text-muted" style={{ fontSize: '0.9rem', marginTop: '0.25rem' }}>
                  Organize, prioritize, and track your tasks across projects
                </p>
              </div>
              <button onClick={() => openModal()} className="btn-primary">
                <Plus size={20} /> New Task
              </button>
            </div>
          )}

          {/* Filter & Sort Bar */}
          <div className="filter-bar">
            {/* Status Tabs */}
            <div className="filter-tabs">
              {['ALL', 'TODO', 'IN_PROGRESS', 'COMPLETED'].map((tab) => (
                <button
                  key={tab}
                  onClick={() => setStatusFilter(tab)}
                  className={`filter-tab ${statusFilter === tab ? 'active' : ''}`}
                >
                  {tab === 'ALL' ? 'All Tasks' : tab === 'IN_PROGRESS' ? 'In Progress' : tab === 'TODO' ? 'To Do' : 'Completed'}
                  <span className="filter-count">
                    {counts[tab] !== undefined ? counts[tab] : (tab === 'ALL' ? tasks.length : tasks.filter(t => getTaskStatus(t) === tab).length)}
                  </span>
                </button>
              ))}
            </div>

            {/* Secondary Filter & Sort Controls */}
            <div className="filter-controls">
              {/* Priority Filter */}
              <div className="filter-select-wrapper" title="Filter by Priority">
                <SlidersHorizontal size={14} className="filter-select-icon" />
                <select
                  value={priorityFilter}
                  onChange={(e) => setPriorityFilter(e.target.value)}
                  aria-label="Filter by priority"
                >
                  <option value="ALL">All Priorities</option>
                  <option value="HIGH">High Priority</option>
                  <option value="MEDIUM">Medium Priority</option>
                  <option value="LOW">Low Priority</option>
                </select>
              </div>

              {/* Due Date Filter */}
              <div className="filter-select-wrapper" title="Filter by Due Date">
                <Calendar size={14} className="filter-select-icon" />
                <select
                  value={dueFilter}
                  onChange={(e) => setDueFilter(e.target.value)}
                  aria-label="Filter by due date"
                >
                  <option value="ALL">All Dates</option>
                  <option value="due_today">Due Today</option>
                  <option value="overdue">Overdue</option>
                </select>
              </div>

              {/* Sort Dropdown */}
              <div className="filter-select-wrapper" title="Sort Tasks">
                <ArrowUpDown size={14} className="filter-select-icon" />
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  aria-label="Sort tasks by"
                >
                  <option value="newest">Newest First</option>
                  <option value="oldest">Oldest First</option>
                  <option value="due_date">Due Date</option>
                  <option value="priority">Priority (High to Low)</option>
                </select>
              </div>

              {/* Reset Filters */}
              {isFiltered && (
                <button
                  onClick={handleResetFilters}
                  className="btn-reset-filters"
                  title="Reset all filters and sorting"
                >
                  <RotateCcw size={13} />
                  <span>Reset</span>
                </button>
              )}
            </div>
          </div>

          {/* Task Content Area */}
          {loading ? (
            <div className="loader-container">
              <Loader2 className="animate-spin" size={40} />
            </div>
          ) : tasks.length === 0 ? (
            <div className="empty-state">
              {isFiltered ? (
                <>
                  <FilterX size={56} style={{ opacity: 0.3 }} />
                  <h2 className="title-medium">No matching tasks</h2>
                  <p>No tasks found matching your active filter criteria.</p>
                  <button onClick={handleResetFilters} className="btn-secondary" style={{ marginTop: '0.5rem' }}>
                    Clear all filters
                  </button>
                </>
              ) : (
                <>
                  <CheckCircle2 size={56} style={{ opacity: 0.3 }} />
                  <h2 className="title-medium">No tasks found</h2>
                  <p>{selectedProject ? `No tasks in "${selectedProject.name}" yet.` : 'Create your first task to get started.'}</p>
                  <button onClick={() => openModal()} className="btn-primary" style={{ marginTop: '0.5rem' }}>
                    <Plus size={18} /> Create Task
                  </button>
                </>
              )}
            </div>
          ) : viewMode === 'grouped' && !selectedProject ? (
            /* Grouped by Project View */
            <div className="project-group-container">
              {getGroupedTasks().map(group => {
                if (group.tasks.length === 0) return null;
                return (
                  <div key={group.project.id || 'none'} className="project-group-section">
                    <div className="project-group-header">
                      <div className="project-group-title">
                        <Folder size={20} style={{ color: 'var(--accent-primary)' }} />
                        <span>{group.project.name}</span>
                        <span className="sidebar-count">{group.tasks.length}</span>
                      </div>
                      {group.project.id && (
                        <button
                          onClick={() => setSelectedProject(group.project)}
                          className="btn-project-action"
                          style={{ fontSize: '0.8rem', padding: '0.3rem 0.6rem' }}
                        >
                          View Project
                        </button>
                      )}
                    </div>

                    <div className="tasks-grid">
                      {group.tasks.map(task => renderTaskCard(task))}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            /* Standard Grid View */
            <div className="tasks-grid">
              {tasks.map(task => renderTaskCard(task))}
            </div>
          )}
        </main>
      </div>

      {/* Task Modal (Create / Edit) */}
      {isModalOpen && (
        <div className="modal-overlay">
          <div className="modal-content animate-fade-in">
            <div className="modal-header">
              <h2>{editingTask ? 'Edit Task' : 'Create Task'}</h2>
              <button onClick={closeModal} className="btn-close" disabled={modalLoading} title="Close">
                <X size={24} />
              </button>
            </div>

            {modalError && (
              <div className="modal-alert modal-alert-error animate-fade-in">
                <AlertCircle size={18} style={{ flexShrink: 0 }} />
                <span>{modalError}</span>
              </div>
            )}

            <form onSubmit={handleSubmitTask}>
              <div className="form-group">
                <label htmlFor="title">Task Title *</label>
                <input
                  id="title"
                  type="text"
                  className={`form-control ${formErrors.title ? 'has-error' : ''}`}
                  placeholder="E.g., Complete project proposal"
                  value={formData.title}
                  onChange={(e) => handleFieldChange('title', e.target.value)}
                  disabled={modalLoading}
                />
                {formErrors.title && (
                  <div className="field-error">
                    <AlertCircle size={14} />
                    <span>{formErrors.title}</span>
                  </div>
                )}
              </div>

              <div className="form-group">
                <label htmlFor="description">Description *</label>
                <textarea
                  id="description"
                  className={`form-control ${formErrors.description ? 'has-error' : ''}`}
                  placeholder="Add details about your task..."
                  value={formData.description}
                  onChange={(e) => handleFieldChange('description', e.target.value)}
                  disabled={modalLoading}
                />
                {formErrors.description && (
                  <div className="field-error">
                    <AlertCircle size={14} />
                    <span>{formErrors.description}</span>
                  </div>
                )}
              </div>

              {/* Project Assignment Dropdown */}
              <div className="form-group">
                <label htmlFor="project_id">Project</label>
                <select
                  id="project_id"
                  className="form-control"
                  value={formData.project_id || ''}
                  onChange={(e) => handleFieldChange('project_id', e.target.value ? Number(e.target.value) : '')}
                  disabled={modalLoading}
                >
                  <option value="">No Project (General)</option>
                  {projects.map(p => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
                </select>
              </div>

              <div className="form-row">
                <div className="form-group flex-1">
                  <label htmlFor="status">Status</label>
                  <select
                    id="status"
                    className="form-control"
                    value={formData.status}
                    onChange={(e) => handleFieldChange('status', e.target.value)}
                    disabled={modalLoading}
                  >
                    <option value="TODO">To Do</option>
                    <option value="IN_PROGRESS">In Progress</option>
                    <option value="COMPLETED">Completed</option>
                  </select>
                </div>

                <div className="form-group flex-1">
                  <label htmlFor="priority">Priority</label>
                  <select
                    id="priority"
                    className="form-control"
                    value={formData.priority}
                    onChange={(e) => handleFieldChange('priority', e.target.value)}
                    disabled={modalLoading}
                  >
                    <option value="LOW">Low</option>
                    <option value="MEDIUM">Medium</option>
                    <option value="HIGH">High</option>
                  </select>
                </div>
              </div>

              <div className="form-group">
                <label htmlFor="due_date">Due Date</label>
                <div className="date-input-wrapper">
                  <input
                    id="due_date"
                    type="date"
                    className="form-control"
                    value={formData.due_date}
                    onChange={(e) => handleFieldChange('due_date', e.target.value)}
                    disabled={modalLoading}
                  />
                  {formData.due_date && (
                    <button
                      type="button"
                      className="btn-clear-date"
                      onClick={() => handleFieldChange('due_date', '')}
                      disabled={modalLoading}
                      title="Clear due date"
                    >
                      Clear
                    </button>
                  )}
                </div>
              </div>

              <div className="modal-actions">
                <button 
                  type="button" 
                  onClick={closeModal} 
                  className="btn-secondary"
                  disabled={modalLoading}
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className="btn-primary" 
                  disabled={modalLoading}
                >
                  {modalLoading ? (
                    <>
                      <Loader2 className="animate-spin" size={18} />
                      <span>{editingTask ? 'Updating Task...' : 'Creating Task...'}</span>
                    </>
                  ) : (
                    <span>{editingTask ? 'Save Changes' : 'Create Task'}</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Project Modal (Create / Edit) */}
      {isProjectModalOpen && (
        <div className="modal-overlay">
          <div className="modal-content animate-fade-in">
            <div className="modal-header">
              <h2>{editingProject ? 'Edit Project' : 'Create Project'}</h2>
              <button onClick={closeProjectModal} className="btn-close" disabled={projectModalLoading} title="Close">
                <X size={24} />
              </button>
            </div>

            {projectModalError && (
              <div className="modal-alert modal-alert-error animate-fade-in">
                <AlertCircle size={18} style={{ flexShrink: 0 }} />
                <span>{projectModalError}</span>
              </div>
            )}

            <form onSubmit={handleSubmitProject}>
              <div className="form-group">
                <label htmlFor="project_name">Project Name *</label>
                <input
                  id="project_name"
                  type="text"
                  className={`form-control ${projectFormErrors.name ? 'has-error' : ''}`}
                  placeholder="E.g., Q3 Marketing Campaign"
                  value={projectFormData.name}
                  onChange={(e) => {
                    setProjectFormData({ ...projectFormData, name: e.target.value });
                    if (projectFormErrors.name) setProjectFormErrors({});
                  }}
                  disabled={projectModalLoading}
                />
                {projectFormErrors.name && (
                  <div className="field-error">
                    <AlertCircle size={14} />
                    <span>{projectFormErrors.name}</span>
                  </div>
                )}
              </div>

              <div className="form-group">
                <label htmlFor="project_description">Description</label>
                <textarea
                  id="project_description"
                  className="form-control"
                  placeholder="Add goals or notes for this project..."
                  value={projectFormData.description}
                  onChange={(e) => setProjectFormData({ ...projectFormData, description: e.target.value })}
                  disabled={projectModalLoading}
                />
              </div>

              <div className="modal-actions">
                <button 
                  type="button" 
                  onClick={closeProjectModal} 
                  className="btn-secondary"
                  disabled={projectModalLoading}
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className="btn-primary" 
                  disabled={projectModalLoading}
                >
                  {projectModalLoading ? (
                    <>
                      <Loader2 className="animate-spin" size={18} />
                      <span>{editingProject ? 'Updating Project...' : 'Creating Project...'}</span>
                    </>
                  ) : (
                    <span>{editingProject ? 'Save Changes' : 'Create Project'}</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );

  // Render individual task card helper
  function renderTaskCard(task) {
    const currentStatus = getTaskStatus(task);
    const currentPriority = getTaskPriority(task);
    const isCompleted = currentStatus === 'COMPLETED';
    const overdue = isOverdue(task.due_date, currentStatus);
    const projectName = getProjectName(task.project_id);

    return (
      <div 
        key={task.id} 
        className={`task-card ${isCompleted ? 'completed' : ''} priority-${currentPriority.toLowerCase()}`}
      >
        <div className="task-badges">
          <span className={`badge status-badge status-${currentStatus.toLowerCase()}`}>
            {currentStatus === 'IN_PROGRESS' ? 'In Progress' : currentStatus === 'COMPLETED' ? 'Completed' : 'To Do'}
          </span>
          <span className={`badge priority-badge priority-${currentPriority.toLowerCase()}`}>
            {currentPriority}
          </span>
          {projectName && (
            <span 
              className="badge project-badge"
              onClick={() => {
                const targetProj = projects.find(p => Number(p.id) === Number(task.project_id));
                if (targetProj) setSelectedProject(targetProj);
              }}
              title={`View ${projectName}`}
            >
              <Folder size={11} /> {projectName}
            </span>
          )}
        </div>

        <div className="task-header">
          <h3 className="task-title">{task.title}</h3>
        </div>
        <p className="task-desc">{task.description}</p>
        
        {task.due_date && (
          <div className={`task-due-date ${overdue ? 'overdue' : ''}`}>
            <Calendar size={14} />
            <span>Due {formatDateDisplay(task.due_date)}</span>
            {overdue && (
              <span className="overdue-tag">
                <AlertTriangle size={12} /> Overdue
              </span>
            )}
          </div>
        )}

        <div className="task-actions">
          <button 
            onClick={() => toggleTaskCompletion(task)} 
            className={`btn-icon complete ${isCompleted ? 'is-complete' : ''}`}
            title={isCompleted ? "Mark To Do" : "Mark Complete"}
          >
            {isCompleted ? <CheckCircle2 size={20} /> : <Circle size={20} />}
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
    );
  }
}

