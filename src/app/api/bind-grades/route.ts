import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  let deviceUUID: string | undefined;
  try {
    const body = await request.json();
    deviceUUID = typeof body.deviceUUID === "string" ? body.deviceUUID : undefined;
  } catch {
    return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  }

  if (!deviceUUID) {
    return NextResponse.json({ ok: true, bound: 0 });
  }

  const [{ count }] = await Promise.all([
    prisma.grade.updateMany({
      where: { deviceUUID, userId: null },
      data: { userId: session.user.id },
    }),
    prisma.user.update({
      where: { id: session.user.id },
      data: { deviceUUID },
    }),
  ]);

  return NextResponse.json({ ok: true, bound: count });
}
