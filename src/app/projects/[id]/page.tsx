"use client";

import React, { use, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { 
  Plus, 
  Trash2, 
  Settings, 
  UserPlus, 
  Calendar, 
  AlertTriangle, 
  ChevronLeft, 
  Users, 
  X, 
  Edit 
} from "lucide-react";
import Navbar from "@/components/Navbar";
import styles from "./project.module.css";

interface User {
  id: string;
  name: string;
  email: string;
}

interface Member {
  userId: string;
  name: string;
  email: string;
  role: string;
}

interface Task {
  id: string;
  title: string;
  description: string | null;
  status: string;
  priority: string;
  dueDate: string | null;
  projectId: string;
  assignee: {
    id: string;
    name: string;
    email: string;
  } | null;
  creator: {
    id: string;
    name: string;
    email: string;
  };
  createdAt: string;
}

interface ProjectData {
  id: string;
  name: string;
  description: string | null;
  createdAt: string;
  currentUserRole: string; // "ADMIN" | "MEMBER"
  members: Member[];
  tasks: Task[];
}

export default function ProjectDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id: projectId } = use(params);
  const router = useRouter();

  const [project, setProject] = useState<ProjectData | null>(null);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Member management state
  const [newMemberEmail, setNewMemberEmail] = useState("");
  const [newMemberRole, setNewMemberRole] = useState("MEMBER");
  const [memberLoading, setMemberLoading] = useState(false);
  const [memberError, setMemberError] = useState<string | null>(null);

  // Task modal state
  const [showTaskModal, setShowTaskModal] = useState(false);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null); // Null for create, Task for edit
  const [taskTitle, setTaskTitle] = useState("");
  const [taskDesc, setTaskDesc] = useState("");
  const [taskStatus, setTaskStatus] = useState("TODO");
  const [taskPriority, setTaskPriority] = useState("MEDIUM");
  const [taskDueDate, setTaskDueDate] = useState("");
  const [taskAssigneeId, setTaskAssigneeId] = useState("");
  const [taskLoading, setTaskLoading] = useState(false);
  const [taskError, setTaskError] = useState<string | null>(null);

  // Project Settings modal state
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [projectName, setProjectName] = useState("");
  const [projectDesc, setProjectDesc] = useState("");
  const [settingsLoading, setSettingsLoading] = useState(false);
  const [settingsError, setSettingsError] = useState<string | null>(null);

  const fetchProjectData = async () => {
    try {
      // Verify user auth
      const userRes = await fetch("/api/auth/me");
      if (!userRes.ok) {
        router.push("/login");
        return;
      }
      const userData = await userRes.json();
      setCurrentUser(userData.user);

      // Fetch project details
      const res = await fetch(`/api/projects/${projectId}`);
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to load project");
      }

      setProject(data.project);
      setProjectName(data.project.name);
      setProjectDesc(data.project.description || "");
      setError(null);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProjectData();
  }, [projectId]);

  // Project settings actions
  const handleUpdateProject = async (e: React.FormEvent) => {
    e.preventDefault();
    setSettingsError(null);
    setSettingsLoading(true);

    try {
      const res = await fetch(`/api/projects/${projectId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: projectName, description: projectDesc }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to update project");

      setShowSettingsModal(false);
      fetchProjectData();
    } catch (err: any) {
      setSettingsError(err.message);
    } finally {
      setSettingsLoading(false);
    }
  };

  const handleDeleteProject = async () => {
    if (!window.confirm("Are you absolutely sure you want to delete this project? This will permanently delete all tasks, roles, and membership records associated with it.")) {
      return;
    }

    setSettingsError(null);
    setSettingsLoading(true);

    try {
      const res = await fetch(`/api/projects/${projectId}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to delete project");

      router.push("/dashboard");
    } catch (err: any) {
      setSettingsError(err.message);
      setSettingsLoading(false);
    }
  };

  // Member management actions
  const handleAddMember = async (e: React.FormEvent) => {
    e.preventDefault();
    setMemberError(null);
    setMemberLoading(true);

    try {
      const res = await fetch(`/api/projects/${projectId}/members`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: newMemberEmail, role: newMemberRole }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to add member");

      setNewMemberEmail("");
      setNewMemberRole("MEMBER");
      fetchProjectData();
    } catch (err: any) {
      setMemberError(err.message);
    } finally {
      setMemberLoading(false);
    }
  };

  const handleRemoveMember = async (targetUserId: string) => {
    if (!window.confirm("Are you sure you want to remove this member from the project?")) {
      return;
    }

    try {
      const res = await fetch(`/api/projects/${projectId}/members`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: targetUserId }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to remove member");

      fetchProjectData();
    } catch (err: any) {
      alert(err.message);
    }
  };

  // Task actions
  const openCreateTaskModal = (status = "TODO") => {
    setSelectedTask(null);
    setTaskTitle("");
    setTaskDesc("");
    setTaskStatus(status);
    setTaskPriority("MEDIUM");
    setTaskDueDate("");
    setTaskAssigneeId("");
    setTaskError(null);
    setShowTaskModal(true);
  };

  const openEditTaskModal = (task: Task) => {
    setSelectedTask(task);
    setTaskTitle(task.title);
    setTaskDesc(task.description || "");
    setTaskStatus(task.status);
    setTaskPriority(task.priority);
    setTaskDueDate(task.dueDate ? task.dueDate.split("T")[0] : "");
    setTaskAssigneeId(task.assignee?.id || "");
    setTaskError(null);
    setShowTaskModal(true);
  };

  const handleSaveTask = async (e: React.FormEvent) => {
    e.preventDefault();
    setTaskError(null);
    setTaskLoading(true);

    const taskPayload = {
      title: taskTitle,
      description: taskDesc,
      status: taskStatus,
      priority: taskPriority,
      dueDate: taskDueDate || null,
      projectId,
      assigneeId: taskAssigneeId || null,
    };

    try {
      let res;
      if (selectedTask) {
        // Edit mode
        res = await fetch(`/api/tasks/${selectedTask.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(taskPayload),
        });
      } else {
        // Create mode
        res = await fetch("/api/tasks", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(taskPayload),
        });
      }

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to save task");

      setShowTaskModal(false);
      fetchProjectData();
    } catch (err: any) {
      setTaskError(err.message);
    } finally {
      setTaskLoading(false);
    }
  };

  const handleDeleteTask = async () => {
    if (!selectedTask) return;
    if (!window.confirm("Are you sure you want to delete this task?")) return;

    setTaskLoading(true);
    setTaskError(null);

    try {
      const res = await fetch(`/api/tasks/${selectedTask.id}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to delete task");

      setShowTaskModal(false);
      fetchProjectData();
    } catch (err: any) {
      setTaskError(err.message);
    } finally {
      setTaskLoading(false);
    }
  };

  if (loading) {
    return (
      <div style={{ display: "flex", minHeight: "100vh", backgroundColor: "var(--bg-primary)" }}>
        <div style={{ margin: "auto", color: "var(--text-secondary)" }}>Loading workspace...</div>
      </div>
    );
  }

  if (error || !project) {
    return (
      <div style={{ display: "flex", minHeight: "100vh", flexDirection: "column", backgroundColor: "var(--bg-primary)" }}>
        <Navbar />
        <div style={{ margin: "auto", textAlign: "center", padding: "40px" }}>
          <AlertTriangle size={48} style={{ color: "var(--error)", marginBottom: "16px" }} />
          <h2 style={{ marginBottom: "10px" }}>Project Not Found</h2>
          <p style={{ color: "var(--text-secondary)", marginBottom: "20px" }}>{error || "You do not have access to this project."}</p>
          <Link href="/dashboard" className="btn-primary">
            Back to Dashboard
          </Link>
        </div>
      </div>
    );
  }

  const isAdmin = project.currentUserRole === "ADMIN";
  
  // Categorize tasks for Kanban
  const columns = [
    { id: "TODO", title: "Todo", styleClass: "badge-todo" },
    { id: "IN_PROGRESS", title: "In Progress", styleClass: "badge-progress" },
    { id: "IN_REVIEW", title: "In Review", styleClass: "badge-review" },
    { id: "DONE", title: "Done", styleClass: "badge-done" },
  ];

  const getTasksByStatus = (status: string) => {
    return project.tasks.filter((t) => t.status === status);
  };

  const getInitials = (name: string) => {
    return name ? name.charAt(0).toUpperCase() : "?";
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return "";
    return new Date(dateString).toLocaleDateString(undefined, {
      month: "short",
      day: "numeric",
    });
  };

  const isTaskOverdue = (dateString: string | null, status: string) => {
    if (!dateString || status === "DONE") return false;
    return new Date(dateString) < new Date();
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", minHeight: "100vh" }}>
      <Navbar />

      <main className={styles.container}>
        {/* Back Link */}
        <Link href="/dashboard" style={{ display: "inline-flex", alignItems: "center", gap: "6px", color: "var(--text-secondary)", textDecoration: "none", fontSize: "0.9rem", marginBottom: "20px" }}>
          <ChevronLeft size={16} />
          <span>Back to Dashboard</span>
        </Link>

        {/* Header Section */}
        <section className={styles.headerSection}>
          <div className={styles.headerLeft}>
            <div className={styles.titleArea}>
              <h1>{project.name}</h1>
              <span className="badge badge-todo">{project.currentUserRole}</span>
            </div>
            <p className={styles.description}>
              {project.description || "No project description provided."}
            </p>
          </div>

          <div className={styles.headerRight}>
            {isAdmin && (
              <button 
                onClick={() => setShowSettingsModal(true)}
                className="btn-secondary"
                style={{ display: "flex", alignItems: "center", gap: "6px" }}
              >
                <Settings size={16} />
                <span>Project Settings</span>
              </button>
            )}
          </div>
        </section>

        {/* Main Workspace */}
        <div className={styles.workspaceLayout}>
          
          {/* Kanban Board Container */}
          <div className={styles.boardContainer}>
            <div className={styles.boardHeader}>
              <h2>Kanban Board</h2>
              <button 
                onClick={() => openCreateTaskModal()}
                className="btn-primary"
                style={{ display: "flex", alignItems: "center", gap: "6px", padding: "8px 14px", fontSize: "0.9rem" }}
              >
                <Plus size={16} />
                <span>Add Task</span>
              </button>
            </div>

            <div className={styles.kanbanBoard}>
              {columns.map((col) => {
                const colTasks = getTasksByStatus(col.id);
                return (
                  <div key={col.id} className={styles.boardColumn}>
                    <div className={styles.columnHeader}>
                      <div className={styles.columnTitle}>
                        <span className={`badge ${col.styleClass}`} style={{ width: "8px", height: "8px", padding: 0, borderRadius: "50%" }} />
                        <span>{col.title}</span>
                      </div>
                      <span className={styles.columnCount}>{colTasks.length}</span>
                    </div>

                    <div className={styles.columnCards}>
                      {colTasks.length === 0 ? (
                        <div style={{ textAlign: "center", color: "var(--text-muted)", fontSize: "0.8rem", padding: "20px 0" }}>
                          No tasks
                        </div>
                      ) : (
                        colTasks.map((task) => (
                          <div 
                            key={task.id} 
                            className={styles.taskCard}
                            onClick={() => openEditTaskModal(task)}
                          >
                            <div className={styles.cardHeader}>
                              <h4 className={styles.cardTitle}>{task.title}</h4>
                              <span className={`priority-${task.priority.toLowerCase()}`} style={{ fontSize: "0.75rem", fontWeight: 600 }}>
                                {task.priority}
                              </span>
                            </div>

                            {task.description && (
                              <p className={styles.cardDesc}>{task.description}</p>
                            )}

                            <div className={styles.cardFooter}>
                              {task.dueDate ? (
                                <div className={`${styles.cardDate} ${isTaskOverdue(task.dueDate, task.status) ? styles.overdueText : ""}`}>
                                  <Calendar size={12} />
                                  <span>{formatDate(task.dueDate)}</span>
                                </div>
                              ) : (
                                <div />
                              )}

                              {task.assignee ? (
                                <div className={styles.cardAssignee} title={`Assigned to ${task.assignee.name}`}>
                                  {getInitials(task.assignee.name)}
                                </div>
                              ) : (
                                <div className={styles.cardAssignee} style={{ borderStyle: "dashed", backgroundColor: "transparent", color: "var(--text-muted)" }} title="Unassigned">
                                  -
                                </div>
                              )}
                            </div>
                          </div>
                        ))
                      )}

                      {/* Column Quick Add */}
                      <button 
                        onClick={() => openCreateTaskModal(col.id)}
                        style={{ display: "flex", alignItems: "center", justifyItems: "center", gap: "6px", width: "100%", padding: "10px", background: "transparent", border: "1px dashed var(--border-color)", color: "var(--text-secondary)", fontSize: "0.85rem", justifyContent: "center" }}
                      >
                        <Plus size={14} />
                        <span>Add to {col.title}</span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Members Sidebar */}
          <aside className={styles.sidebar}>
            <div className={styles.widgetBlock}>
              <h3>
                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  <Users size={18} />
                  <span>Project Members ({project.members.length})</span>
                </div>
              </h3>

              <div className={styles.memberList}>
                {project.members.map((member) => (
                  <div key={member.userId} className={styles.memberItem}>
                    <div className={styles.memberInfo}>
                      <div className={styles.memberAvatar}>{getInitials(member.name)}</div>
                      <div className={styles.memberDetails}>
                        <span className={styles.memberName}>{member.name}</span>
                        <span className={styles.memberEmail}>{member.email}</span>
                      </div>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                      <span className={`badge ${member.role === "ADMIN" ? "badge-progress" : "badge-todo"} ${styles.memberRoleBadge}`}>
                        {member.role}
                      </span>
                      {isAdmin && member.userId !== currentUser?.id && (
                        <button 
                          onClick={() => handleRemoveMember(member.userId)}
                          className={styles.removeMemberBtn}
                          title="Remove user"
                        >
                          <X size={14} />
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              {/* Add member form - Admin only */}
              {isAdmin && (
                <form onSubmit={handleAddMember} className={styles.addMemberForm}>
                  <h4 style={{ fontSize: "0.85rem", fontWeight: 600, color: "var(--text-secondary)" }}>Invite Member</h4>
                  {memberError && <div className={styles.widgetError}>{memberError}</div>}
                  <input 
                    type="email" 
                    placeholder="email@example.com" 
                    value={newMemberEmail}
                    onChange={(e) => setNewMemberEmail(e.target.value)}
                    required
                    style={{ padding: "8px 12px", fontSize: "0.85rem" }}
                  />
                  <div style={{ display: "flex", gap: "8px" }}>
                    <select 
                      value={newMemberRole}
                      onChange={(e) => setNewMemberRole(e.target.value)}
                      style={{ padding: "8px 12px", fontSize: "0.85rem", flex: 1 }}
                    >
                      <option value="MEMBER">Member</option>
                      <option value="ADMIN">Admin</option>
                    </select>
                    <button 
                      type="submit" 
                      className="btn-primary"
                      disabled={memberLoading}
                      style={{ padding: "8px 14px", fontSize: "0.85rem", display: "flex", alignItems: "center", gap: "4px" }}
                    >
                      <UserPlus size={14} />
                      <span>Add</span>
                    </button>
                  </div>
                </form>
              )}
            </div>
          </aside>
        </div>
      </main>

      {/* Task Modal (Create & Edit) */}
      {showTaskModal && (
        <div className={styles.modalOverlay}>
          <div className={styles.modal}>
            <div className={styles.modalHeader}>
              <h3>{selectedTask ? "Edit Task" : "Create New Task"}</h3>
              <button 
                onClick={() => setShowTaskModal(false)} 
                className={styles.closeBtn}
              >
                <X size={18} />
              </button>
            </div>

            {taskError && <div className={styles.widgetError} style={{ marginBottom: "16px", padding: "10px", border: "1px solid rgba(239, 68, 68, 0.2)", borderRadius: "var(--radius-md)", backgroundColor: "var(--error-bg)", textAlign: "center" }}>{taskError}</div>}

            <form onSubmit={handleSaveTask} className={styles.modalForm}>
              <div className={styles.inputGroup}>
                <label className={styles.label}>Task Title</label>
                <input 
                  type="text" 
                  placeholder="Task title..." 
                  value={taskTitle}
                  onChange={(e) => setTaskTitle(e.target.value)}
                  required 
                />
              </div>

              <div className={styles.inputGroup}>
                <label className={styles.label}>Description</label>
                <textarea 
                  placeholder="Provide task details..." 
                  value={taskDesc}
                  onChange={(e) => setTaskDesc(e.target.value)}
                  rows={3}
                  style={{ resize: "vertical" }}
                />
              </div>

              <div className={styles.formRow}>
                <div className={styles.inputGroup}>
                  <label className={styles.label}>Status</label>
                  <select 
                    value={taskStatus} 
                    onChange={(e) => setTaskStatus(e.target.value)}
                  >
                    <option value="TODO">Todo</option>
                    <option value="IN_PROGRESS">In Progress</option>
                    <option value="IN_REVIEW">In Review</option>
                    <option value="DONE">Done</option>
                  </select>
                </div>

                <div className={styles.inputGroup}>
                  <label className={styles.label}>Priority</label>
                  <select 
                    value={taskPriority} 
                    onChange={(e) => setTaskPriority(e.target.value)}
                  >
                    <option value="LOW">Low</option>
                    <option value="MEDIUM">Medium</option>
                    <option value="HIGH">High</option>
                  </select>
                </div>
              </div>

              <div className={styles.formRow}>
                <div className={styles.inputGroup}>
                  <label className={styles.label}>Due Date</label>
                  <input 
                    type="date" 
                    value={taskDueDate} 
                    onChange={(e) => setTaskDueDate(e.target.value)}
                  />
                </div>

                <div className={styles.inputGroup}>
                  <label className={styles.label}>Assignee</label>
                  <select 
                    value={taskAssigneeId} 
                    onChange={(e) => setTaskAssigneeId(e.target.value)}
                  >
                    <option value="">Unassigned</option>
                    {project.members.map((m) => (
                      <option key={m.userId} value={m.userId}>
                        {m.name} ({m.role.toLowerCase()})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {selectedTask && (
                <div style={{ fontSize: "0.75rem", color: "var(--text-muted)", display: "flex", gap: "20px", marginTop: "4px" }}>
                  <span>Created by: {selectedTask.creator.name}</span>
                  <span>Created: {new Date(selectedTask.createdAt).toLocaleDateString()}</span>
                </div>
              )}

              <div className={styles.taskDetailActions}>
                <div>
                  {selectedTask && (isAdmin || selectedTask.creator.id === currentUser?.id) && (
                    <button 
                      type="button" 
                      onClick={handleDeleteTask}
                      className="btn-danger"
                      disabled={taskLoading}
                      style={{ display: "flex", alignItems: "center", gap: "6px" }}
                    >
                      <Trash2 size={16} />
                      <span>Delete</span>
                    </button>
                  )}
                </div>

                <div style={{ display: "flex", gap: "12px" }}>
                  <button 
                    type="button" 
                    onClick={() => setShowTaskModal(false)}
                    className="btn-secondary"
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit" 
                    className="btn-primary"
                    disabled={taskLoading}
                  >
                    {taskLoading ? "Saving..." : "Save"}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Project Settings Modal (Admin only) */}
      {showSettingsModal && isAdmin && (
        <div className={styles.modalOverlay}>
          <div className={styles.modal}>
            <div className={styles.modalHeader}>
              <h3>Project Settings</h3>
              <button 
                onClick={() => {
                  setShowSettingsModal(false);
                  setSettingsError(null);
                }} 
                className={styles.closeBtn}
              >
                <X size={18} />
              </button>
            </div>

            {settingsError && <div className={styles.widgetError} style={{ marginBottom: "16px" }}>{settingsError}</div>}

            <form onSubmit={handleUpdateProject} className={styles.modalForm}>
              <div className={styles.inputGroup}>
                <label className={styles.label}>Rename Project</label>
                <input 
                  type="text" 
                  value={projectName}
                  onChange={(e) => setProjectName(e.target.value)}
                  required 
                />
              </div>

              <div className={styles.inputGroup}>
                <label className={styles.label}>Project Description</label>
                <textarea 
                  value={projectDesc}
                  onChange={(e) => setProjectDesc(e.target.value)}
                  rows={4}
                  style={{ resize: "vertical" }}
                />
              </div>

              <div style={{ border: "1px solid rgba(239, 68, 68, 0.25)", backgroundColor: "var(--error-bg)", borderRadius: "var(--radius-md)", padding: "16px", marginTop: "24px", display: "flex", flexDirection: "column", gap: "10px" }}>
                <h4 style={{ fontSize: "0.9rem", color: "#f87171", fontWeight: 600, display: "flex", alignItems: "center", gap: "6px" }}>⚠️ Danger Zone</h4>
                <p style={{ fontSize: "0.8rem", color: "#fca5a5", lineHeight: "1.4" }}>
                  Deleting this project will permanently remove it, including all members, settings, and task data. This cannot be undone.
                </p>
                <button 
                  type="button" 
                  onClick={handleDeleteProject}
                  className="btn-danger"
                  disabled={settingsLoading}
                  style={{ width: "100%", display: "flex", alignItems: "center", justifyContent: "center", gap: "8px", height: "40px", marginTop: "4px" }}
                >
                  <Trash2 size={16} />
                  <span>Delete Project</span>
                </button>
              </div>

              <div className={styles.modalActions} style={{ borderTop: "1px solid var(--border-color)", paddingTop: "16px" }}>
                <button 
                  type="button" 
                  onClick={() => {
                    setShowSettingsModal(false);
                    setSettingsError(null);
                  }}
                  className="btn-secondary"
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className="btn-primary"
                  disabled={settingsLoading}
                >
                  {settingsLoading ? "Saving..." : "Save Changes"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
