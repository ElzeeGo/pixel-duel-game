import { NextResponse } from "next/server";
import { hash } from "bcrypt";
import { z } from "zod";

import { db } from "@/lib/db";

const registerSchema = z.object({
  username: z.string().min(3),
  email: z.string().email(),
  password: z.string().min(6),
});

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { username, email, password } = registerSchema.parse(body);

    // Check if user already exists
    const existingUserByUsername = await db.user.findUnique({
      where: { username },
    });

    if (existingUserByUsername) {
      return NextResponse.json(
        { message: "Username already exists" },
        { status: 409 }
      );
    }

    if (email) {
      const existingUserByEmail = await db.user.findUnique({
        where: { email },
      });

      if (existingUserByEmail) {
        return NextResponse.json(
          { message: "Email already exists" },
          { status: 409 }
        );
      }
    }

    // Hash password
    const hashedPassword = await hash(password, 10);

    // Create user
    const user = await db.user.create({
      data: {
        username,
        email,
        passwordHash: hashedPassword,
        pointsBalance: 10, // Initial points balance
      },
    });

    // Create transaction record for initial points
    await db.transaction.create({
      data: {
        userId: user.id,
        amount: 10,
        type: "INITIAL_BALANCE",
        description: "Initial points balance for new user",
      },
    });

    return NextResponse.json(
      { message: "User created successfully" },
      { status: 201 }
    );
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { message: "Invalid request data", errors: error.errors },
        { status: 400 }
      );
    }

    console.error("Registration error:", error);
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    );
  }
} 