import { useState } from 'react';
import { useGetProjectsQuery, useCreateProjectMutation, useDeleteProjectMutation } from '../api/projectApi';

import Header from '../components/Layout/Header';
import { Plus, FolderOpen, Trash2, Users } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useToast } from '../context/ToastContext';

export default function Projects() {
  const [showModal, setShowModal] = useState(false);
  const [projectName, setProjectName] = useState('');
  const [projectDesc, setProjectDesc] = useState('');
  const { data, isLoading, refetch } = useGetProjectsQuery(undefined,{
    pollingInterval: 60000, 
     skipPollingIfUnfocused: true,
  });
  const [createProject, { isLoading: isCreating }] = useCreateProjectMutation();
  const [deleteProject] = useDeleteProjectMutation();
  const {addToast} = useToast()

  const projects = data?.projects || [];

  const handleCreateProject = async (e: React.SubmitEvent) => {
    e.preventDefault();
    if (!projectName.trim()) return;

    try {
      await createProject({ name: projectName, description: projectDesc }).unwrap();
      setShowModal(false);
      setProjectName('');
      setProjectDesc('');
      addToast("Project created successfully!","success")
      refetch();
    } catch (error) {
      console.error('Failed to create project:', error);
      addToast("Error in creating project!","error")
    }
  };

  const handleDeleteProject = async (id: string) => {
    if (confirm('Are you sure you want to delete this project?')) {
      try {
        await deleteProject(id).unwrap();
        addToast("Project deleted successfully!","success")
        refetch();
      } catch (error) {
        console.error('Failed to delete project:', error);
        addToast("Error in deleting project!","error")
      }
    }
  };

  if (isLoading) {
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
        title="Projects" 
        subtitle="Manage your projects and team collaboration"
      />

      <div className="mb-6 flex justify-end">
        <button
          onClick={() => setShowModal(true)}
          className="neo-button flex items-center gap-2 rounded-xl px-4 py-2 font-semibold"
        >
          <Plus size={18} />
          New Project
        </button>
      </div>

      {projects.length === 0 ? (
        <div className="neo-card p-12 text-center">
          <FolderOpen className="mx-auto h-12 w-12 opacity-50" />
          <h3 className="mt-4 text-xl font-semibold">No projects yet</h3>
          <p className="mt-2 opacity-70">Create your first project to get started</p>
          <button
            onClick={() => setShowModal(true)}
            className="neo-button mt-6 inline-flex items-center gap-2 rounded-xl px-6 py-2 font-semibold"
          >
            <Plus size={18} />
            Create Project
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {projects.map((project) => (
            <div key={project.id} className="neo-card group relative p-6 transition-all hover:-translate-y-1">
              <Link to={`/projects/${project.id}`}>
                <h3 className="mb-2 text-xl font-semibold hover:text-primary-text">
                  {project.name}
                </h3>
                {project.description && (
                  <p className="mb-4 text-sm opacity-70 line-clamp-2">{project.description}</p>
                )}
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <Users size={14} />
                    <span>{project.stats?.totalTasks || 0} tasks</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="h-2 w-20 overflow-hidden rounded-full neo-input">
                      <div 
                        className="h-full bg-green-500 transition-all"
                        style={{ width: `${project.stats?.totalTasks ? ((project.stats.completedTasks || 0) / project.stats.totalTasks) * 100 : 0}%` }}
                      />
                    </div>
                    <span className="text-xs">
                      {project.stats?.totalTasks ? Math.round(((project.stats.completedTasks || 0) / project.stats.totalTasks) * 100) : 0}%
                    </span>
                  </div>
                </div>
              </Link>
              <button
                onClick={(e) => {
                  e.preventDefault();
                  handleDeleteProject(project.id);
                }}
                className="absolute right-4 top-4 opacity-0 transition-opacity group-hover:opacity-100"
              >
                <Trash2 size={16} className="text-red-500 hover:text-red-600" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Create Project Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="neo-card w-full max-w-md p-6">
            <h2 className="mb-4 text-2xl font-bold">Create New Project</h2>
            <form onSubmit={handleCreateProject}>
              <div className="mb-4">
                <label className="mb-2 block text-sm font-medium">Project Name</label>
                <input
                  type="text"
                  value={projectName}
                  onChange={(e) => setProjectName(e.target.value)}
                  className="neo-input w-full rounded-xl px-4 py-2 outline-none"
                  placeholder="Enter project name"
                  required
                />
              </div>
              <div className="mb-6">
                <label className="mb-2 block text-sm font-medium">Description (Optional)</label>
                <textarea
                  value={projectDesc}
                  onChange={(e) => setProjectDesc(e.target.value)}
                  className="neo-input w-full rounded-xl px-4 py-2 outline-none"
                  rows={3}
                  placeholder="Enter project description"
                />
              </div>
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="neo-button flex-1 rounded-xl py-2"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isCreating}
                  className="neo-button flex-1 rounded-xl bg-primary py-2 font-semibold disabled:opacity-50"
                >
                  {isCreating ? 'Creating...' : 'Create Project'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
   </div>
  );
}