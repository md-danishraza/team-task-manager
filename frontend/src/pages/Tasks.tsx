import { useState } from 'react';
import { useGetTasksQuery, useUpdateTaskStatusMutation, useDeleteTaskMutation } from '../api/taskApi';
import { useGetProjectsQuery } from '../api/projectApi';

import Header from '../components/Layout/Header';
import { Search, Filter, Calendar, Flag, User as UserIcon, Trash2, RefreshCw } from 'lucide-react';
import { format } from 'date-fns';
import type { TaskStatus, TaskPriority, Task } from '../types';
import { useToast } from '../context/ToastContext';

const statusOptions: { value: TaskStatus | 'all'; label: string }[] = [
  { value: 'all', label: 'All Status' },
  { value: 'todo', label: 'To Do' },
  { value: 'in_progress', label: 'In Progress' },
  
  { value: 'done', label: 'Done' },
];

const priorityOptions: { value: TaskPriority | 'all'; label: string }[] = [
  { value: 'all', label: 'All Priorities' },
  { value: 'low', label: 'Low' },
  { value: 'medium', label: 'Medium' },
  { value: 'high', label: 'High' },
];

function TaskTableRow({ task, onStatusChange, onDelete }: { 
  task: Task; 
  onStatusChange: (id: string, status: TaskStatus) => void;
  onDelete: (id: string) => void;
}) {
  const isOverdue = task.dueDate && new Date(task.dueDate) < new Date() && task.status !== 'done';
  
  return (
    <div className="neo-card mb-3 p-4 transition-all hover:-translate-y-0.5">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div className="flex-1">
          <div className="flex items-start gap-2">
            <h4 className="font-semibold text-primary-text">{task.title}</h4>
            {isOverdue && (
              <span className="text-xs bg-red-500/20 text-red-500 px-2 py-0.5 rounded-full">Overdue</span>
            )}
          </div>
          {task.description && (
            <p className="mt-1 text-sm opacity-70 line-clamp-2">{task.description}</p>
          )}
          <div className="mt-2 flex flex-wrap items-center gap-2 text-xs">
            <span className="px-2 py-1 rounded-full bg-primary">
              {task.project?.name}
            </span>
            <span className={`px-2 py-1 rounded-full ${
              task.priority === 'high' ? 'bg-red-500/20 text-red-500' :
              task.priority === 'medium' ? 'bg-yellow-500/20 text-yellow-500' :
              'bg-green-500/20 text-green-500'
            }`}>
              <Flag size={12} className="inline mr-1" />
              {task.priority}
            </span>
            {task.dueDate && (
              <span className={`px-2 py-1 rounded-full ${isOverdue ? 'bg-red-500/20 text-red-500' : 'bg-primary'}`}>
                <Calendar size={12} className="inline mr-1" />
                {format(new Date(task.dueDate), 'MMM dd, yyyy')}
              </span>
            )}
            {task.assignee && (
              <span className="px-2 py-1 rounded-full bg-primary">
                <UserIcon size={12} className="inline mr-1" />
                {task.assignee.name}
              </span>
            )}
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <select
            value={task.status}
            onChange={(e) => onStatusChange(task.id, e.target.value as TaskStatus)}
            className={`neo-input rounded-lg px-3 py-1 text-sm ${
              task.status === 'done' ? 'text-green-500' :
              task.status === 'in_progress' ? 'text-blue-500' :
              'text-gray-500'
            }`}
          >
            <option value="todo">To Do</option>
            <option value="in_progress">In Progress</option>
            <option value="done">Done</option>
          </select>
          
          <button
            onClick={() => onDelete(task.id)}
            className="neo-flat-sm rounded-lg p-2 hover:text-red-500 transition-colors"
          >
            <Trash2 size={16} />
          </button>
        </div>
      </div>
    </div>
  );
}

export default function Tasks() {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<TaskStatus | 'all'>('all');
  const [priorityFilter, setPriorityFilter] = useState<TaskPriority | 'all'>('all');
  const [projectFilter, setProjectFilter] = useState<string>('all');
  const {addToast} = useToast()
  
  const { data: tasksData, isLoading: tasksLoading, refetch: refetchTasks } = useGetTasksQuery({},{
    pollingInterval: 60000, 
     skipPollingIfUnfocused: true,
  });
  const { data: projectsData, isLoading: projectsLoading } = useGetProjectsQuery(undefined,{
    pollingInterval: 60000, 
     skipPollingIfUnfocused: true,
  });
  const [updateTaskStatus] = useUpdateTaskStatusMutation();
  const [deleteTask] = useDeleteTaskMutation();
  
  const tasks = tasksData?.tasks || [];
  const projects = projectsData?.projects || [];
  
  const handleStatusChange = async (taskId: string, status: TaskStatus) => {
    try {
      await updateTaskStatus({ id: taskId, status }).unwrap();
      addToast("Status updated successfully!","success")
      refetchTasks();
    } catch (error) {
      console.error('Failed to update task status:', error);
      addToast(error?.data?.error,"error")

    }
  };
  
  const handleDeleteTask = async (taskId: string) => {
    if (confirm('Are you sure you want to delete this task?')) {
      try {
        await deleteTask(taskId).unwrap();
        refetchTasks();
      } catch (error) {
        console.error('Failed to delete task:', error);
      }
    }
  };
  
  // Filter tasks
  const filteredTasks = tasks.filter(task => {
    const matchesSearch = task.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          (task.description?.toLowerCase().includes(searchTerm.toLowerCase()) || false);
    const matchesStatus = statusFilter === 'all' || task.status === statusFilter;
    const matchesPriority = priorityFilter === 'all' || task.priority === priorityFilter;
    const matchesProject = projectFilter === 'all' || task.projectId === projectFilter;
    
    return matchesSearch && matchesStatus && matchesPriority && matchesProject;
  });
  
  const stats = {
    total: filteredTasks.length,
    todo: filteredTasks.filter(t => t.status === 'todo').length,
    inProgress: filteredTasks.filter(t => t.status === 'in_progress').length,
    done: filteredTasks.filter(t => t.status === 'done').length,
    overdue: filteredTasks.filter(t => t.dueDate && new Date(t.dueDate) < new Date() && t.status !== 'done').length,
  };
  
  if (tasksLoading || projectsLoading) {
    return (
      <div className="animate-fade-in">
        <div className="flex h-96 items-center justify-center">
          <div className="loading-spinner"></div>
        </div>
      </div>
    );
  }
  
  return (
    <div className="animate-fade-in">
      <Header 
        title="All Tasks" 
        subtitle="Manage and track all your tasks across projects"
      />
      
      {/* Stats Cards */}
      <div className="mb-6 grid grid-cols-2 gap-3 md:grid-cols-5">
        <div className="neo-card p-3 text-center">
          <p className="text-xs opacity-70">Total</p>
          <p className="text-xl font-bold">{stats.total}</p>
        </div>
        <div className="neo-card p-3 text-center">
          <p className="text-xs opacity-70">To Do</p>
          <p className="text-xl font-bold text-gray-500">{stats.todo}</p>
        </div>
        <div className="neo-card p-3 text-center">
          <p className="text-xs opacity-70">In Progress</p>
          <p className="text-xl font-bold text-blue-500">{stats.inProgress}</p>
        </div>
        <div className="neo-card p-3 text-center">
          <p className="text-xs opacity-70">Done</p>
          <p className="text-xl font-bold text-green-500">{stats.done}</p>
        </div>
        <div className="neo-card p-3 text-center">
          <p className="text-xs opacity-70">Overdue</p>
          <p className="text-xl font-bold text-red-500">{stats.overdue}</p>
        </div>
      </div>
      
      {/* Filters */}
      <div className="neo-card mb-6 p-4">
        <div className="flex flex-wrap gap-4">
          {/* Search */}
          <div className="flex-1 min-w-[200px]">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 opacity-50" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="neo-input w-full rounded-xl py-2 pl-10 pr-4 outline-none"
                placeholder="Search tasks..."
              />
            </div>
          </div>
          
          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as any)}
            className="neo-input rounded-xl px-4 py-2 outline-none"
          >
            {statusOptions.map(opt => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
          
          {/* Priority Filter */}
          <select
            value={priorityFilter}
            onChange={(e) => setPriorityFilter(e.target.value as any)}
            className="neo-input rounded-xl px-4 py-2 outline-none"
          >
            {priorityOptions.map(opt => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
          
          {/* Project Filter */}
          <select
            value={projectFilter}
            onChange={(e) => setProjectFilter(e.target.value)}
            className="neo-input rounded-xl px-4 py-2 outline-none"
          >
            <option value="all">All Projects</option>
            {projects.map(project => (
              <option key={project.id} value={project.id}>{project.name}</option>
            ))}
          </select>
          
          {/* Refresh Button */}
          <button
            onClick={() => refetchTasks()}
            className="neo-button rounded-xl px-4 py-2"
          >
            <RefreshCw size={18} />
          </button>
        </div>
      </div>
      
      {/* Tasks List */}
      {filteredTasks.length === 0 ? (
        <div className="neo-card p-12 text-center">
          <Filter className="mx-auto h-12 w-12 opacity-50" />
          <h3 className="mt-4 text-xl font-semibold">No tasks found</h3>
          <p className="mt-2 opacity-70">
            {searchTerm || statusFilter !== 'all' || priorityFilter !== 'all' || projectFilter !== 'all'
              ? 'Try adjusting your filters'
              : 'Create your first task from a project'}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredTasks.map((task) => (
            <TaskTableRow
              key={task.id}
              task={task}
              onStatusChange={handleStatusChange}
              onDelete={handleDeleteTask}
            />
          ))}
        </div>
      )}
    </div>
  );
}