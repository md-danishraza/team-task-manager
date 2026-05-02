import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useGetProjectQuery, useGetProjectMembersQuery, useAddMemberMutation, useRemoveMemberMutation } from '../api/projectApi';
import { useGetTasksQuery, useCreateTaskMutation, useUpdateTaskStatusMutation, useDeleteTaskMutation } from '../api/taskApi';

import Header from '../components/Layout/Header';
import { Plus, X, UserPlus, Users, Trash2, Calendar, Flag, User as UserIcon } from 'lucide-react';
import { format } from 'date-fns';
import type { Task, TaskStatus } from '../types';
import { useToast } from '../context/ToastContext';

type ColumnType = { status: TaskStatus; title: string; color: string };

const columns: ColumnType[] = [
  { status: 'todo', title: 'To Do', color: 'bg-gray-500' },
  { status: 'in_progress', title: 'In Progress', color: 'bg-blue-500' },
  { status: 'done', title: 'Done', color: 'bg-green-500' },
];

function TaskCard({ task, onStatusChange, onDelete, currentUserRole }: { 
  task: Task; 
  onStatusChange: (id: string, status: TaskStatus) => void;
  onDelete: (id: string) => void;
  currentUserRole: string | null;
}) {
  const canEdit = currentUserRole === 'admin' || task.assignedTo === task.creator?.id;

  
  
  return (
    <div className="neo-card mb-3 p-4 transition-all hover:-translate-y-0.5">
      <div className="mb-2 flex items-start justify-between">
        <h4 className="font-semibold text-primary-text">{task.title}</h4>
        {canEdit && (
          <button
            onClick={() => onDelete(task.id)}
            className="opacity-0 transition-opacity group-hover:opacity-100"
          >
            <Trash2 size={14} className="text-red-500" />
          </button>
        )}
      </div>
      
      {task.description && (
        <p className="mb-3 text-sm opacity-70 line-clamp-2">{task.description}</p>
      )}
      
      <div className="flex flex-wrap items-center gap-2 text-xs">
        <span className={`px-2 py-1 rounded-full ${
          task.priority === 'high' ? 'bg-red-500/20 text-red-500' :
          task.priority === 'medium' ? 'bg-yellow-500/20 text-yellow-500' :
          'bg-green-500/20 text-green-500'
        }`}>
          <Flag size={12} className="inline mr-1" />
          {task.priority}
        </span>
        
        {task.dueDate && (
          <span className={`px-2 py-1 rounded-full ${
            new Date(task.dueDate) < new Date() && task.status !== 'done'
              ? 'bg-red-500/20 text-red-500'
              : 'bg-primary'
          }`}>
            <Calendar size={12} className="inline mr-1" />
            {format(new Date(task.dueDate), 'MMM dd')}
          </span>
        )}
        
        {task.assignee && (
          <span className="px-2 py-1 rounded-full bg-primary">
            <UserIcon size={12} className="inline mr-1" />
            {task.assignee.name.split(' ')[0]}
          </span>
        )}
      </div>
      
      {canEdit && task.status !== 'done' && (
        <select
          value={task.status}
          onChange={(e) => onStatusChange(task.id, e.target.value as TaskStatus)}
          className="neo-input mt-3 w-full rounded-lg px-2 py-1 text-xs"
        >
          <option value="todo">Move to To Do</option>
          <option value="in_progress">Move to In Progress</option>
          <option value="done">Move to Done</option>
        </select>
      )}
    </div>
  );
}

export default function ProjectDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [showTaskModal, setShowTaskModal] = useState(false);
  const [showMemberModal, setShowMemberModal] = useState(false);
  const [memberEmail, setMemberEmail] = useState('');
  const [memberRole, setMemberRole] = useState<'admin' | 'member'>('member');
  
  const [newTask, setNewTask] = useState({
    title: '',
    description: '',
    priority: 'medium' as const,
    dueDate: '',
    assignedTo: '',
  });
  
  const { data: projectData, isLoading: projectLoading } = useGetProjectQuery(id!,{
    pollingInterval: 60000, 
     skipPollingIfUnfocused: true,
  });
  const { data: membersData, refetch: refetchMembers } = useGetProjectMembersQuery(id!, { skip: !id,
    pollingInterval: 60000, 
     skipPollingIfUnfocused: true,

   });
  const { data: tasksData, refetch: refetchTasks } = useGetTasksQuery({ projectId: id },{
    pollingInterval: 60000, 
     skipPollingIfUnfocused: true,
  });
  const [createTask, { isLoading: isCreating }] = useCreateTaskMutation();
  const [updateTaskStatus] = useUpdateTaskStatusMutation();
  const [deleteTask] = useDeleteTaskMutation();
  const [addMember] = useAddMemberMutation();
  const [removeMember] = useRemoveMemberMutation();
  const { addToast } = useToast(); 
  
  const project = projectData?.project;
  const userRole = projectData?.userRole;
  const members = membersData?.members || [];
  const tasks = tasksData?.tasks || [];
  const isAdmin = userRole === 'admin';
  
  useEffect(() => {
    if (!projectLoading && !project) {
      navigate('/projects');
    }
  }, [project, projectLoading, navigate]);
  
  const handleCreateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTask.title.trim()) return;
    
    try {
      await createTask({
        ...newTask,
        projectId: id!,
        dueDate: newTask.dueDate || undefined,
        assignedTo: newTask.assignedTo || undefined,
      }).unwrap();
      setShowTaskModal(false);
      setNewTask({ title: '', description: '', priority: 'medium', dueDate: '', assignedTo: '' });
      refetchTasks();
    } catch (error) {
      console.error('Failed to create task:', error);
    }
  };
  
  const handleStatusChange = async (taskId: string, status: TaskStatus) => {
    try {
      await updateTaskStatus({ id: taskId, status }).unwrap();
      refetchTasks();
    } catch (error) {
      console.error('Failed to update task status:', error);
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
  
  const handleAddMember = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!memberEmail.trim()) return;
    
    try {
      await addMember({ id: id!, email: memberEmail, role: memberRole }).unwrap();
      setShowMemberModal(false);
      setMemberEmail('');
      setMemberRole('member');
      refetchMembers();
    } catch (error: any) {
      
      addToast(error.data?.error, 'error');
    }
  };
  
  const handleRemoveMember = async (memberId: string, memberName: string) => {
    if (confirm(`Remove ${memberName} from this project?`)) {
      try {
        await removeMember({ id: id!, memberId }).unwrap();
        refetchMembers();
      } catch (error) {
        console.error('Failed to remove member:', error);
      }
    }
  };
  
  if (projectLoading) {
    return (
      <div className="animate-fade-in">
        <div className="flex h-96 items-center justify-center">
          <div className="loading-spinner"></div>
        </div>
      </div>
    );
  }
  
  if (!project) return null;
  
  const tasksByStatus = {
    todo: tasks.filter(t => t.status === 'todo'),
    in_progress: tasks.filter(t => t.status === 'in_progress'),
    done: tasks.filter(t => t.status === 'done'),
  };
  
  return (
    <div className="animate-fade-in">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <Header title={project.name} subtitle={project.description || 'No description provided'} />
        </div>
        <div className="flex gap-3">
          {isAdmin && (
            <button
              onClick={() => setShowMemberModal(true)}
              className="neo-button flex items-center gap-2 rounded-xl px-4 py-2 font-semibold"
            >
              <UserPlus size={18} />
              Add Member
            </button>
          )}
          <button
            onClick={() => setShowTaskModal(true)}
            className="neo-button flex items-center gap-2 rounded-xl px-4 py-2 font-semibold"
          >
            <Plus size={18} />
            New Task
          </button>
        </div>
      </div>
      
      {/* Members Section */}
      <div className="neo-card mb-6 p-4">
        <div className="flex items-center gap-2 mb-3">
          <Users size={18} />
          <h3 className="font-semibold">Team Members ({members.length})</h3>
        </div>
        <div className="flex flex-wrap gap-2">
          {members.map((member) => (
            <div key={member.id} className="flex items-center gap-2 neo-flat-sm rounded-full px-3 py-1">
              <span className="text-sm">{member.user.name}</span>
              <span className="text-xs opacity-70">({member.role})</span>
              {isAdmin && member.user.id !== project.createdBy && (
                <button
                  onClick={() => handleRemoveMember(member.user.id, member.user.name)}
                  className="ml-1 hover:text-red-500"
                >
                  <X size={14} />
                </button>
              )}
            </div>
          ))}
        </div>
      </div>
      
      {/* Task Board */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        {columns.map((column) => (
          <div key={column.status} className="neo-card p-4">
            <div className={`mb-4 flex items-center justify-between`}>
              <h3 className="font-semibold">{column.title}</h3>
              <span className={`px-2 py-1 rounded-full text-xs text-white ${column.color}`}>
                {tasksByStatus[column.status].length}
              </span>
            </div>
            <div className="max-h-[calc(100vh-400px)] overflow-y-auto">
              {tasksByStatus[column.status].map((task) => (
                <TaskCard
                  key={task.id}
                  task={task}
                  onStatusChange={handleStatusChange}
                  onDelete={handleDeleteTask}
                  currentUserRole={userRole}
                />
              ))}
              {tasksByStatus[column.status].length === 0 && (
                <div className="py-8 text-center text-sm opacity-50">
                  No tasks in {column.title.toLowerCase()}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
      
      {/* Create Task Modal */}
      {showTaskModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="neo-card w-full max-w-md p-6">
            <h2 className="mb-4 text-2xl font-bold">Create New Task</h2>
            <form onSubmit={handleCreateTask}>
              <div className="mb-4">
                <label className="mb-2 block text-sm font-medium">Task Title *</label>
                <input
                  type="text"
                  value={newTask.title}
                  onChange={(e) => setNewTask({ ...newTask, title: e.target.value })}
                  className="neo-input w-full rounded-xl px-4 py-2 outline-none"
                  placeholder="Enter task title"
                  required
                />
              </div>
              
              <div className="mb-4">
                <label className="mb-2 block text-sm font-medium">Description</label>
                <textarea
                  value={newTask.description}
                  onChange={(e) => setNewTask({ ...newTask, description: e.target.value })}
                  className="neo-input w-full rounded-xl px-4 py-2 outline-none"
                  rows={3}
                  placeholder="Enter task description"
                />
              </div>
              
              <div className="mb-4">
                <label className="mb-2 block text-sm font-medium">Priority</label>
                <select
                  value={newTask.priority}
                  onChange={(e) => setNewTask({ ...newTask, priority: e.target.value as any })}
                  className="neo-input w-full rounded-xl px-4 py-2 outline-none"
                >
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                </select>
              </div>
              
              <div className="mb-4">
                <label className="mb-2 block text-sm font-medium">Due Date</label>
                <input
                  type="datetime-local"
                  value={newTask.dueDate}
                  onChange={(e) => setNewTask({ ...newTask, dueDate: e.target.value })}
                  className="neo-input w-full rounded-xl px-4 py-2 outline-none"
                />
              </div>
              
              <div className="mb-6">
                <label className="mb-2 block text-sm font-medium">Assign To</label>
                <select
                  value={newTask.assignedTo}
                  onChange={(e) => setNewTask({ ...newTask, assignedTo: e.target.value })}
                  className="neo-input w-full rounded-xl px-4 py-2 outline-none"
                >
                  <option value="">Unassigned</option>
                  {members.map((member) => (
                    <option key={member.user.id} value={member.user.id}>
                      {member.user.name} ({member.user.email})
                    </option>
                  ))}
                </select>
              </div>
              
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setShowTaskModal(false)}
                  className="neo-button flex-1 rounded-xl py-2"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isCreating}
                  className="neo-button flex-1 rounded-xl bg-primary py-2 font-semibold disabled:opacity-50"
                >
                  {isCreating ? 'Creating...' : 'Create Task'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      
      {/* Add Member Modal */}
      {showMemberModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="neo-card w-full max-w-md p-6">
            <h2 className="mb-4 text-2xl font-bold">Add Team Member</h2>
            <form onSubmit={handleAddMember}>
              <div className="mb-4">
                <label className="mb-2 block text-sm font-medium">User Email *</label>
                <input
                  type="email"
                  value={memberEmail}
                  onChange={(e) => setMemberEmail(e.target.value)}
                  className="neo-input w-full rounded-xl px-4 py-2 outline-none"
                  placeholder="user@example.com"
                  required
                />
              </div>
              
              <div className="mb-6">
                <label className="mb-2 block text-sm font-medium">Role</label>
                <select
                  value={memberRole}
                  onChange={(e) => setMemberRole(e.target.value as any)}
                  className="neo-input w-full rounded-xl px-4 py-2 outline-none"
                >
                  <option value="member">Member</option>
                  <option value="admin">Admin</option>
                </select>
              </div>
              
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setShowMemberModal(false)}
                  className="neo-button flex-1 rounded-xl py-2"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="neo-button flex-1 rounded-xl bg-primary py-2 font-semibold"
                >
                  Add Member
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}