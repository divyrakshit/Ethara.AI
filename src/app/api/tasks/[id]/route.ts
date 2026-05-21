import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { db } from "@/lib/db";
import { verifyToken } from "@/lib/auth";

async function getAuthUser() {
  const cookieStore = await cookies();
  const token = cookieStore.get("token")?.value;
  if (!token) return null;
  return verifyToken(token);
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getAuthUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id: taskId } = await params;
    const body = await request.json();

    // 1. Fetch existing task and check project membership
    const existingTask = await db.task.findUnique({
      where: { id: taskId },
    });

    if (!existingTask) {
      return NextResponse.json({ error: "Task not found" }, { status: 404 });
    }

    const memberRecord = await db.projectMember.findUnique({
      where: {
        projectId_userId: {
          projectId: existingTask.projectId,
          userId: user.userId,
        },
      },
    });

    if (!memberRecord) {
      return NextResponse.json(
        { error: "Access Denied: You must be a project member to edit tasks" },
        { status: 403 }
      );
    }

    // 2. Validate request parameters
    const updateData: any = {};

    if (body.title !== undefined) {
      if (body.title.trim() === "") {
        return NextResponse.json({ error: "Title cannot be empty" }, { status: 400 });
      }
      updateData.title = body.title.trim();
    }

    if (body.description !== undefined) {
      updateData.description = body.description ? body.description.trim() : null;
    }

    if (body.status !== undefined) {
      const validStatuses = ["TODO", "IN_PROGRESS", "IN_REVIEW", "DONE"];
      if (!validStatuses.includes(body.status)) {
        return NextResponse.json({ error: "Invalid status value" }, { status: 400 });
      }
      updateData.status = body.status;
    }

    if (body.priority !== undefined) {
      const validPriorities = ["LOW", "MEDIUM", "HIGH"];
      if (!validPriorities.includes(body.priority)) {
        return NextResponse.json({ error: "Invalid priority value" }, { status: 400 });
      }
      updateData.priority = body.priority;
    }

    if (body.dueDate !== undefined) {
      updateData.dueDate = body.dueDate ? new Date(body.dueDate) : null;
    }

    if (body.assigneeId !== undefined) {
      if (body.assigneeId) {
        // Verify assignee is member of the project
        const assigneeMember = await db.projectMember.findUnique({
          where: {
            projectId_userId: {
              projectId: existingTask.projectId,
              userId: body.assigneeId,
            },
          },
        });

        if (!assigneeMember) {
          return NextResponse.json(
            { error: "Assignee must be a member of this project" },
            { status: 400 }
          );
        }
        updateData.assigneeId = body.assigneeId;
      } else {
        updateData.assigneeId = null;
      }
    }

    // 3. Update the task
    const updatedTask = await db.task.update({
      where: { id: taskId },
      data: updateData,
      include: {
        assignee: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        creator: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    return NextResponse.json({
      message: "Task updated successfully",
      task: updatedTask,
    });
  } catch (error: any) {
    console.error("PUT task error:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getAuthUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id: taskId } = await params;

    // 1. Fetch task and check relations
    const task = await db.task.findUnique({
      where: { id: taskId },
    });

    if (!task) {
      return NextResponse.json({ error: "Task not found" }, { status: 404 });
    }

    // 2. Fetch project membership to check role
    const memberRecord = await db.projectMember.findUnique({
      where: {
        projectId_userId: {
          projectId: task.projectId,
          userId: user.userId,
        },
      },
    });

    if (!memberRecord) {
      return NextResponse.json(
        { error: "Access Denied: You must be a project member to manage tasks" },
        { status: 403 }
      );
    }

    // 3. Validate deletion rights: Creator OR Project Admin
    const isCreator = task.creatorId === user.userId;
    const isAdmin = memberRecord.role === "ADMIN";

    if (!isCreator && !isAdmin) {
      return NextResponse.json(
        { error: "Access Denied: Only project Admins or the task creator can delete it" },
        { status: 403 }
      );
    }

    // 4. Delete
    await db.task.delete({
      where: { id: taskId },
    });

    return NextResponse.json({ message: "Task deleted successfully" });
  } catch (error: any) {
    console.error("DELETE task error:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
