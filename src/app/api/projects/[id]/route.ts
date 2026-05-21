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

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getAuthUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    // Verify user is member of the project
    const memberRecord = await db.projectMember.findUnique({
      where: {
        projectId_userId: {
          projectId: id,
          userId: user.userId,
        },
      },
    });

    if (!memberRecord) {
      return NextResponse.json({ error: "Access Denied" }, { status: 403 });
    }

    const project = await db.project.findUnique({
      where: { id },
      include: {
        members: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
          },
        },
        tasks: {
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
          orderBy: {
            createdAt: "desc",
          },
        },
      },
    });

    if (!project) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    // Format output
    const formattedProject = {
      id: project.id,
      name: project.name,
      description: project.description,
      createdAt: project.createdAt,
      updatedAt: project.updatedAt,
      currentUserRole: memberRecord.role,
      members: project.members.map((m) => ({
        userId: m.user.id,
        name: m.user.name,
        email: m.user.email,
        role: m.role,
      })),
      tasks: project.tasks.map((t) => ({
        id: t.id,
        title: t.title,
        description: t.description,
        status: t.status,
        priority: t.priority,
        dueDate: t.dueDate,
        projectId: t.projectId,
        assignee: t.assignee ? { id: t.assignee.id, name: t.assignee.name, email: t.assignee.email } : null,
        creator: { id: t.creator.id, name: t.creator.name, email: t.creator.email },
        createdAt: t.createdAt,
        updatedAt: t.updatedAt,
      })),
    };

    return NextResponse.json({ project: formattedProject });
  } catch (error: any) {
    console.error("GET project detail error:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
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

    const { id } = await params;
    const { name, description } = await request.json();

    // Verify user is an ADMIN of the project
    const memberRecord = await db.projectMember.findUnique({
      where: {
        projectId_userId: {
          projectId: id,
          userId: user.userId,
        },
      },
    });

    if (!memberRecord || memberRecord.role !== "ADMIN") {
      return NextResponse.json(
        { error: "Access Denied: Project Admin role required" },
        { status: 403 }
      );
    }

    if (!name || name.trim() === "") {
      return NextResponse.json(
        { error: "Project name is required" },
        { status: 400 }
      );
    }

    const updatedProject = await db.project.update({
      where: { id },
      data: {
        name: name.trim(),
        description: description ? description.trim() : null,
      },
    });

    return NextResponse.json({
      message: "Project updated successfully",
      project: updatedProject,
    });
  } catch (error: any) {
    console.error("PUT project error:", error);
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

    const { id } = await params;

    // Verify user is an ADMIN of the project
    const memberRecord = await db.projectMember.findUnique({
      where: {
        projectId_userId: {
          projectId: id,
          userId: user.userId,
        },
      },
    });

    if (!memberRecord || memberRecord.role !== "ADMIN") {
      return NextResponse.json(
        { error: "Access Denied: Project Admin role required" },
        { status: 403 }
      );
    }

    // Cascade delete is handled by database constraint (Prisma schemas map Cascade onDelete)
    await db.project.delete({
      where: { id },
    });

    return NextResponse.json({ message: "Project deleted successfully" });
  } catch (error: any) {
    console.error("DELETE project error:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
