import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export async function POST(request: Request) {
  const session = await auth();
  const cookieHeader = request.headers.get("cookie") ?? "";
  const uuidMatch = cookieHeader.match(/sl_uuid=([^;]+)/);
  const cookieUUID = uuidMatch?.[1];

  let gradeId: string;
  let won: boolean;
  try {
    const body = await request.json();
    gradeId = body.gradeId;
    won = Boolean(body.won);
  } catch {
    return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  }

  const grade = await prisma.grade.findUnique({ where: { id: gradeId } });
  if (!grade) {
    return NextResponse.json({ error: "Grade not found" }, { status: 404 });
  }

  const ownedByUser = session?.user?.id && grade.userId === session.user.id;
  const ownedByDevice = cookieUUID && grade.deviceUUID === cookieUUID;
  if (!ownedByUser && !ownedByDevice) {
    return NextResponse.json({ error: "Not authorized" }, { status: 403 });
  }

  await prisma.grade.update({
    where: { id: gradeId },
    data: { settled: true, won },
  });

  return NextResponse.json({ ok: true });
}
