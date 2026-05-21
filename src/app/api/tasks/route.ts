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

export async function GET() {
  try {
    const user = await getAuthUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Fetch all tasks for projects the user belongs to
    const tasks = await db.task.findMany({
      where: {
        project: {
          members: {
            some: {
              userId: user.userId,
            },
          },
        },
      },
      include: {
        project: {
          select: {
            id: true,
            name: true,
          },
        },
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
      orderBy: [
        { dueDate: "asc" },
        { createdAt: "desc" },
      ],
    });

    return NextResponse.json({ tasks });
  } catch (error: any) {
    console.error("GET tasks error:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const user = await getAuthUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const {
      title,
      description,
      status,
      priority,
      dueDate,
      projectId,
      assigneeId,
    } = await request.json();

    // Validations
    if (!title || title.trim() === "") {
      return NextResponse.json({ error: "Task title is required" }, { status: 400 });
    }
    if (!projectId) {
      return NextResponse.json({ error: "Project ID is required" }, { status: 400 });
    }

    const validStatuses = ["TODO", "IN_PROGRESS", "IN_REVIEW", "DONE"];
    const validPriorities = ["LOW", "MEDIUM", "HIGH"];

    const taskStatus = validStatuses.includes(status) ? status : "TODO";
    const taskPriority = validPriorities.includes(priority) ? priority : "MEDIUM";

    // 1. Verify user is a member of the project
    const memberRecord = await db.projectMember.findUnique({
      where: {
        projectId_userId: {
          projectId,
          userId: user.userId,
        },
      },
    });

    if (!memberRecord) {
      return NextResponse.json(
        { error: "Access Denied: You must be a member of this project to add tasks" },
        { status: 403 }
      );
    }

    // 2. If assignee is specified, verify they are also a member of this project
    if (assigneeId) {
      const assigneeMember = await db.projectMember.findUnique({
        where: {
          projectId_userId: {
            projectId,
            userId: assigneeId,
          },
        },
      });

      if (!assigneeMember) {
        return NextResponse.json(
          { error: "Assignee must be a member of this project" },
          { status: 400 }
        );
      }
    }

    // 3. Create the task
    const task = await db.task.create({
      data: {
        title: title.trim(),
        description: description ? description.trim() : null,
        status: taskStatus,
        priority: taskPriority,
        dueDate: dueDate ? new Date(dueDate) : null,
        projectId,
        assigneeId: assigneeId || null,
        creatorId: user.userId,
      },
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

    return NextResponse.json(
      { message: "Task created successfully", task },
      { status: 201 }
    );
  } catch (error: any) {
    console.error("POST task error:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
