import { NextRequest, NextResponse } from "next/server";
import { User } from "@/types";

// Minimal demo auth - in production, use Firebase Auth / Auth0 / NextAuth
// This simulates login by accepting any email/password and returning a user object

export async function POST(request: NextRequest) {
  try {
    const { email, password, mode } = await request.json();

    if (!email || !password) {
      return NextResponse.json(
        { error: "이메일과 비밀번호를 입력해주세요" },
        { status: 400 }
      );
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: "올바른 이메일 형식을 입력해주세요" },
        { status: 400 }
      );
    }

    if (password.length < 6) {
      return NextResponse.json(
        { error: "비밀번호는 6자 이상이어야 합니다" },
        { status: 400 }
      );
    }

    // Demo: just return a user object
    const user: User = {
      userId: Buffer.from(email).toString("base64"),
      email,
      createdAt: new Date(),
    };

    return NextResponse.json({ user, mode });
  } catch {
    return NextResponse.json(
      { error: "서버 오류가 발생했습니다" },
      { status: 500 }
    );
  }
}
