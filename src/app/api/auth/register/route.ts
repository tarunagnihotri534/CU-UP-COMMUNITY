import { NextResponse } from "next/server";
import { registerStudent, setSessionCookie } from "@/lib/auth";

export async function POST(request: Request) {
  try {
    const { name, email, password, enrollmentNo, department } =
      await request.json();
    if (!name || !email || !password)
      return NextResponse.json(
        { error: "Name, Email, and Password are required" },
        { status: 400 },
      );
    if (password.length < 6)
      return NextResponse.json(
        { error: "Password must be at least 6 characters" },
        { status: 400 },
      );

    const result = await registerStudent({
      name,
      email,
      password,
      enrollmentNo,
      department,
    });
    if (!result.success)
      return NextResponse.json({ error: result.error }, { status: 409 });

    await setSessionCookie(result.token);
    return NextResponse.json({ success: true });
  } catch (e) {
    console.error(e);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
