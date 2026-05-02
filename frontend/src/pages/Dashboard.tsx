import { useGetProjectsQuery } from '../api/projectApi';
import { useGetTasksQuery } from '../api/taskApi';
import { useAppSelector } from '../store/hooks';

import Header from '../components/Layout/Header';
import { FolderKanban, CheckSquare, TrendingUp, Clock } from 'lucide-react';

function StatCard({ title, value, icon: Icon, color }: { title: string; value: number; icon: any; color: string }) {
  return (
    <div className="neo-card p-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm opacity-70">{title}</p>
          <p className="text-3xl font-bold text-primary-text">{value}</p>
        </div>
        <div className={`rounded-full p-3 ${color} bg-opacity-10`}>
          <Icon className={`h-6 w-6 ${color}`} />
        </div>
      </div>
    </div>
  );
}

export default function Dashboard() {
  const { user  } = useAppSelector((state) => state.auth.user);
  const { data: projectsData, isLoading: projectsLoading } = useGetProjectsQuery(undefined,{
     pollingInterval: 60000, 
     skipPollingIfUnfocused: true,
  });
  const { data: tasksData, isLoading: tasksLoading } = useGetTasksQuery({},{
    // 1 minute = 60,000 milliseconds
    pollingInterval: 60000, 
    // PRO TIP: Stops polling when the user switches browser tabs!
    skipPollingIfUnfocused: true,
  });

  

  const projects = projectsData?.projects || [];
  const tasks = tasksData?.tasks || [];

  const stats = {
    totalProjects: projects.length,
    totalTasks: tasks.length,
    completedTasks: tasks.filter(t => t.status === 'done').length,
    inProgressTasks: tasks.filter(t => t.status === 'in_progress').length,
    overdueTasks: tasks.filter(t => t.dueDate && new Date(t.dueDate) < new Date() && t.status !== 'done').length,
  };

  const recentTasks = tasks.slice(0, 5);

  if (projectsLoading || tasksLoading) {
    return (
      <div className="animate-fade-in">
        <div className="flex h-96 items-center justify-center">
          <div className="loading-spinner"></div>
        </div>
      </div >
    );
  }

  return (
    <div className="animate-fade-in">
      <Header 
        title={`Welcome back, ${user?.name?.split(' ')[0]}!`} 
        subtitle="Here's what's happening with your projects"
      />

      {/* Stats Grid */}
      <div className="mb-8 grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard 
          title="Total Projects" 
          value={stats.totalProjects} 
          icon={FolderKanban}
          color="text-blue-500"
        />
        <StatCard 
          title="Total Tasks" 
          value={stats.totalTasks} 
          icon={CheckSquare}
          color="text-green-500"
        />
        <StatCard 
          title="In Progress" 
          value={stats.inProgressTasks} 
          icon={TrendingUp}
          color="text-yellow-500"
        />
        <StatCard 
          title="Overdue" 
          value={stats.overdueTasks} 
          icon={Clock}
          color="text-red-500"
        />
      </div>

      {/* Progress Section */}
      <div className="mb-8 grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Task Completion Progress */}
        <div className="neo-card p-6">
          <h3 className="mb-4 text-lg font-semibold">Task Completion</h3>
          <div className="mb-2 flex justify-between text-sm">
            <span>Progress</span>
            <span>{stats.totalTasks > 0 ? Math.round((stats.completedTasks / stats.totalTasks) * 100) : 0}%</span>
          </div>
          <div className="neo-input h-2 rounded-full overflow-hidden">
            <div 
              className="h-full bg-green-500 transition-all duration-500"
              style={{ width: `${stats.totalTasks > 0 ? (stats.completedTasks / stats.totalTasks) * 100 : 0}%` }}
            />
          </div>
          <div className="mt-4 flex justify-between text-sm">
            <span>Completed: {stats.completedTasks}</span>
            <span>Remaining: {stats.totalTasks - stats.completedTasks}</span>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="neo-card p-6">
          <h3 className="mb-4 text-lg font-semibold">Quick Stats</h3>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="opacity-70">Projects Created</span>
              <span className="font-semibold">{stats.totalProjects}</span>
            </div>
            <div className="flex justify-between">
              <span className="opacity-70">Tasks Assigned</span>
              <span className="font-semibold">{stats.totalTasks}</span>
            </div>
            <div className="flex justify-between">
              <span className="opacity-70">Completion Rate</span>
              <span className="font-semibold">
                {stats.totalTasks > 0 ? Math.round((stats.completedTasks / stats.totalTasks) * 100) : 0}%
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Tasks */}
      <div className="neo-card p-6">
        <h3 className="mb-4 text-lg font-semibold">Recent Tasks</h3>
        {recentTasks.length === 0 ? (
          <p className="text-center opacity-70 py-8">No tasks yet. Create your first task!</p>
        ) : (
          <div className="space-y-3">
            {recentTasks.map((task) => (
              <div key={task.id} className="flex items-center justify-between border-b border-opacity-10 pb-3 last:border-0">
                <div>
                  <p className="font-medium">{task.title}</p>
                  <p className="text-sm opacity-70">{task.project?.name}</p>
                </div>
                <div className="flex items-center gap-3">
                  <span className={`text-xs px-2 py-1 rounded-full ${
                    task.priority === 'high' ? 'bg-red-500/20 text-red-500' :
                    task.priority === 'medium' ? 'bg-yellow-500/20 text-yellow-500' :
                    'bg-green-500/20 text-green-500'
                  }`}>
                    {task.priority}
                  </span>
                  <span className={`text-xs px-2 py-1 rounded-full ${
                    task.status === 'done' ? 'bg-green-500/20 text-green-500' :
                    task.status === 'in_progress' ? 'bg-blue-500/20 text-blue-500' :
                    'bg-gray-500/20 text-gray-500'
                  }`}>
                    {task.status.replace('_', ' ')}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
      </div>
  );
}