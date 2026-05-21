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

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getAuthUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id: projectId } = await params;
    const { email, role } = await request.json();

    if (!email) {
      return NextResponse.json({ error: "Member email is required" }, { status: 400 });
    }

    const targetRole = role === "ADMIN" ? "ADMIN" : "MEMBER";

    // 1. Verify requester is an ADMIN of the project
    const requesterMember = await db.projectMember.findUnique({
      where: {
        projectId_userId: {
          projectId,
          userId: user.userId,
        },
      },
    });

    if (!requesterMember || requesterMember.role !== "ADMIN") {
      return NextResponse.json(
        { error: "Access Denied: Project Admin role required to manage members" },
        { status: 403 }
      );
    }

    // 2. Find target user by email
    const targetUser = await db.user.findUnique({
      where: { email: email.toLowerCase().trim() },
    });

    if (!targetUser) {
      return NextResponse.json(
        { error: "User with this email does not exist" },
        { status: 404 }
      );
    }

    // 3. Check if user is already a member
    const existingMember = await db.projectMember.findUnique({
      where: {
        projectId_userId: {
          projectId,
          userId: targetUser.id,
        },
      },
    });

    if (existingMember) {
      return NextResponse.json(
        { error: "User is already a member of this project" },
        { status: 409 }
      );
    }

    // 4. Create membership
    const member = await db.projectMember.create({
      data: {
        projectId,
        userId: targetUser.id,
        role: targetRole,
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    return NextResponse.json(
      {
        message: "Member added successfully",
        member: {
          userId: member.user.id,
          name: member.user.name,
          email: member.user.email,
          role: member.role,
        },
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error("POST project member error:", error);
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

    const { id: projectId } = await params;
    const { userId: targetUserId } = await request.json();

    if (!targetUserId) {
      return NextResponse.json({ error: "User ID to remove is required" }, { status: 400 });
    }

    // 1. Verify requester is an ADMIN of the project
    const requesterMember = await db.projectMember.findUnique({
      where: {
        projectId_userId: {
          projectId,
          userId: user.userId,
        },
      },
    });

    if (!requesterMember || requesterMember.role !== "ADMIN") {
      return NextResponse.json(
        { error: "Access Denied: Project Admin role required to manage members" },
        { status: 403 }
      );
    }

    // 2. Check if target user exists in project
    const targetMember = await db.projectMember.findUnique({
      where: {
        projectId_userId: {
          projectId,
          userId: targetUserId,
        },
      },
    });

    if (!targetMember) {
      return NextResponse.json(
        { error: "User is not a member of this project" },
        { status: 404 }
      );
    }

    // 3. Prevent deleting the last Admin of the project
    if (targetMember.role === "ADMIN") {
      const adminCount = await db.projectMember.count({
        where: {
          projectId,
          role: "ADMIN",
        },
      });

      if (adminCount <= 1) {
        return NextResponse.json(
          { error: "Cannot remove the last project Admin. Assign another admin first." },
          { status: 400 }
        );
      }
    }

    // 4. Delete membership
    await db.projectMember.delete({
      where: {
        projectId_userId: {
          projectId,
          userId: targetUserId,
        },
      },
    });

    return NextResponse.json({ message: "Member removed successfully" });
  } catch (error: any) {
    console.error("DELETE project member error:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
