"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { 
  Plus, 
  Folder, 
  CheckSquare, 
  Clock, 
  AlertTriangle, 
  Calendar, 
  Users, 
  X, 
  Layers 
} from "lucide-react";
import Navbar from "@/components/Navbar";
import styles from "./dashboard.module.css";

interface User {
  id: string;
  name: string;
  email: string;
}

interface Project {
  id: string;
  name: string;
  description: string | null;
  role: string;
  memberCount: number;
  taskCount: number;
}

interface Task {
  id: string;
  title: string;
  description: string | null;
  status: string;
  priority: string;
  dueDate: string | null;
  projectId: string;
  project: {
    id: string;
    name: string;
  };
  assignee: {
    id: string;
    name: string;
  } | null;
}

export default function DashboardPage() {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [projects, setProjects] = useState<Project[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Create Project Modal State
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [projectName, setProjectName] = useState("");
  const [projectDesc, setProjectDesc] = useState("");
  const [createLoading, setCreateLoading] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);

  const router = useRouter();

  const fetchData = async () => {
    try {
      // Fetch current user
      const userRes = await fetch("/api/auth/me");
      if (!userRes.ok) {
        router.push("/login");
        return;
      }
      const userData = await userRes.json();
      setCurrentUser(userData.user);

      // Fetch projects
      const projectsRes = await fetch("/api/projects");
      const projectsData = await projectsRes.json();
      setProjects(projectsData.projects || []);

      // Fetch tasks
      const tasksRes = await fetch("/api/tasks");
      const tasksData = await tasksRes.json();
      setTasks(tasksData.tasks || []);
    } catch (error) {
      console.error("Error loading dashboard data:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleCreateProject = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreateError(null);
    setCreateLoading(true);

    try {
      const res = await fetch("/api/projects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: projectName, description: projectDesc }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to create project");
      }

      setProjectName("");
      setProjectDesc("");
      setShowCreateModal(false);
      
      // Refresh dashboard data
      fetchData();
    } catch (err: any) {
      setCreateError(err.message);
    } finally {
      setCreateLoading(false);
    }
  };

  if (loading) {
    return (
      <div style={{ display: "flex", minHeight: "100vh", flexDirection: "column", backgroundColor: "var(--bg-primary)" }}>
        <div style={{ margin: "auto", color: "var(--text-secondary)" }}>Loading dashboard...</div>
      </div>
    );
  }

  // Calculate statistics
  // 1. My tasks: Assigned to logged-in user
  const myTasks = tasks.filter(t => t.assignee?.id === currentUser?.id);
  
  // 2. Statistics across ALL projects the user is in
  const totalTasksCount = tasks.length;
  const inProgressCount = tasks.filter(t => t.status === "IN_PROGRESS" || t.status === "IN_REVIEW").length;
  const completedCount = tasks.filter(t => t.status === "DONE").length;
  
  // 3. Overdue Tasks: Active tasks where due date has passed
  const now = new Date();
  const overdueTasks = tasks.filter(t => {
    if (t.status === "DONE" || !t.dueDate) return false;
    return new Date(t.dueDate) < now;
  });
  const overdueCount = overdueTasks.length;

  // Filter tasks assigned to me that are not completed
  const myActiveTasks = myTasks.filter(t => t.status !== "DONE");

  const formatDate = (dateString: string | null) => {
    if (!dateString) return "";
    return new Date(dateString).toLocaleDateString(undefined, {
      month: "short",
      day: "numeric",
    });
  };

  const isOverdue = (dateString: string | null) => {
    if (!dateString) return false;
    return new Date(dateString) < now;
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", minHeight: "100vh" }}>
      <Navbar />

      <main className={styles.container}>
        <div className={styles.welcomeSection}>
          <h1>Welcome, {currentUser?.name}</h1>
          <p>Here is an overview of your projects and task progress.</p>
        </div>

        {/* Stats Grid */}
        <section className={styles.statsGrid}>
          <div className={styles.statCard}>
            <div className={`${styles.iconWrapper} ${styles.totalIcon}`}>
              <Layers size={24} />
            </div>
            <div className={styles.statContent}>
              <h3>Total Tasks</h3>
              <p>{totalTasksCount}</p>
            </div>
          </div>

          <div className={styles.statCard}>
            <div className={`${styles.iconWrapper} ${styles.progressIcon}`}>
              <Clock size={24} />
            </div>
            <div className={styles.statContent}>
              <h3>In Progress</h3>
              <p>{inProgressCount}</p>
            </div>
          </div>

          <div className={styles.statCard}>
            <div className={`${styles.iconWrapper} ${styles.completedIcon}`}>
              <CheckSquare size={24} />
            </div>
            <div className={styles.statContent}>
              <h3>Completed</h3>
              <p>{completedCount}</p>
            </div>
          </div>

          <div className={styles.statCard}>
            <div className={`${styles.iconWrapper} ${styles.overdueIcon}`}>
              <AlertTriangle size={24} />
            </div>
            <div className={styles.statContent}>
              <h3>Overdue</h3>
              <p>{overdueCount}</p>
            </div>
          </div>
        </section>

        {/* Split Section */}
        <div className={styles.layoutSplit}>
          {/* Projects Column */}
          <section>
            <div className={styles.sectionHeader}>
              <h2>My Projects</h2>
              <button 
                onClick={() => setShowCreateModal(true)}
                className="btn-primary"
                style={{ display: "flex", alignItems: "center", gap: "6px", padding: "8px 14px", fontSize: "0.9rem" }}
              >
                <Plus size={16} />
                <span>New Project</span>
              </button>
            </div>

            {projects.length === 0 ? (
              <div className={styles.sidebarBlock} style={{ textAlign: "center", padding: "40px" }}>
                <Folder size={48} style={{ color: "var(--text-muted)", marginBottom: "16px" }} />
                <p style={{ color: "var(--text-secondary)", marginBottom: "16px" }}>No projects yet. Create a new one to get started!</p>
                <button onClick={() => setShowCreateModal(true)} className="btn-primary">
                  Create Project
                </button>
              </div>
            ) : (
              <div className={styles.projectGrid}>
                {projects.map((project) => (
                  <Link 
                    href={`/projects/${project.id}`} 
                    key={project.id}
                    className={styles.projectCard}
                  >
                    <div>
                      <div className={styles.projectHeader}>
                        <h3 className={styles.projectTitle}>{project.name}</h3>
                        <span className="badge badge-todo" style={{ fontSize: "0.7rem" }}>
                          {project.role}
                        </span>
                      </div>
                      <p className={styles.projectDesc}>
                        {project.description || "No description provided."}
                      </p>
                    </div>

                    <div className={styles.projectMeta}>
                      <div className={styles.projectStats}>
                        <div className={styles.projectStatItem}>
                          <CheckSquare size={14} />
                          <span>{project.taskCount} tasks</span>
                        </div>
                        <div className={styles.projectStatItem}>
                          <Users size={14} />
                          <span>{project.memberCount} members</span>
                        </div>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </section>

          {/* Tasks & Overdue Column */}
          <aside>
            {/* Overdue Tasks */}
            {overdueTasks.length > 0 && (
              <div className={styles.sidebarBlock} style={{ borderColor: "rgba(239, 68, 68, 0.2)", background: "rgba(239, 68, 68, 0.02)" }}>
                <h2 style={{ color: "var(--error)", borderBottomColor: "rgba(239, 68, 68, 0.1)", display: "flex", alignItems: "center", gap: "8px" }}>
                  <AlertTriangle size={18} />
                  <span>Attention: Overdue ({overdueCount})</span>
                </h2>
                <div className={styles.cardList}>
                  {overdueTasks.slice(0, 5).map((task) => (
                    <div 
                      key={task.id} 
                      className={styles.taskItem}
                      onClick={() => router.push(`/projects/${task.projectId}`)}
                    >
                      <div className={styles.taskItemHeader}>
                        <span className={styles.taskItemTitle}>{task.title}</span>
                        <span className={`badge badge-review`}>
                          {task.status.replace("_", " ")}
                        </span>
                      </div>
                      <div className={styles.taskItemMeta}>
                        <span className={styles.taskProject}>{task.project.name}</span>
                        <span className={`${styles.taskDate} ${styles.overdueText}`}>
                          <Calendar size={12} />
                          <span>{formatDate(task.dueDate)}</span>
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* My Active Tasks */}
            <div className={styles.sidebarBlock}>
              <h2>My Active Tasks ({myActiveTasks.length})</h2>
              {myActiveTasks.length === 0 ? (
                <div className={styles.emptyState}>
                  <p>You have no active tasks assigned to you.</p>
                </div>
              ) : (
                <div className={styles.cardList}>
                  {myActiveTasks.map((task) => (
                    <div 
                      key={task.id} 
                      className={styles.taskItem}
                      onClick={() => router.push(`/projects/${task.projectId}`)}
                    >
                      <div className={styles.taskItemHeader}>
                        <span className={styles.taskItemTitle}>{task.title}</span>
                        <span className={`badge ${
                          task.status === "IN_PROGRESS" ? "badge-progress" : 
                          task.status === "IN_REVIEW" ? "badge-review" : "badge-todo"
                        }`}>
                          {task.status.replace("_", " ")}
                        </span>
                      </div>
                      <div className={styles.taskItemMeta}>
                        <span className={styles.taskProject}>{task.project.name}</span>
                        {task.dueDate && (
                          <span className={`${styles.taskDate} ${isOverdue(task.dueDate) ? styles.overdueText : ""}`}>
                            <Calendar size={12} />
                            <span>{formatDate(task.dueDate)}</span>
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </aside>
        </div>
      </main>

      {/* Create Project Modal */}
      {showCreateModal && (
        <div className={styles.modalOverlay}>
          <div className={styles.modal}>
            <div className={styles.modalHeader}>
              <h3>Create New Project</h3>
              <button 
                onClick={() => {
                  setShowCreateModal(false);
                  setCreateError(null);
                }} 
                className={styles.closeBtn}
              >
                <X size={18} />
              </button>
            </div>

            {createError && <div className={styles.error} style={{ marginBottom: "16px" }}>{createError}</div>}

            <form onSubmit={handleCreateProject} className={styles.modalForm}>
              <div className={styles.inputGroup}>
                <label className={styles.label}>Project Name</label>
                <input 
                  type="text" 
                  placeholder="e.g. Website Redesign" 
                  value={projectName}
                  onChange={(e) => setProjectName(e.target.value)}
                  required 
                />
              </div>

              <div className={styles.inputGroup}>
                <label className={styles.label}>Description (Optional)</label>
                <textarea 
                  placeholder="Describe the goals and scope of this project..." 
                  value={projectDesc}
                  onChange={(e) => setProjectDesc(e.target.value)}
                  rows={4}
                  style={{ resize: "vertical" }}
                />
              </div>

              <div className={styles.modalActions}>
                <button 
                  type="button" 
                  onClick={() => {
                    setShowCreateModal(false);
                    setCreateError(null);
                  }}
                  className="btn-secondary"
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className="btn-primary"
                  disabled={createLoading}
                >
                  {createLoading ? "Creating..." : "Create Project"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
