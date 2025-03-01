import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";

import { db } from "@/lib/db";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

// Function to generate random sprite data
function generateSpriteData(country: string) {
  // In a real implementation, this would generate more complex sprite data
  // based on the country selection and random attributes
  const colors = ["red", "blue", "green", "purple", "orange"];
  const randomColor = colors[Math.floor(Math.random() * colors.length)];
  
  return JSON.stringify({
    country,
    baseColor: randomColor,
    hairStyle: Math.floor(Math.random() * 5),
    faceStyle: Math.floor(Math.random() * 3),
    armorStyle: Math.floor(Math.random() * 4),
    weaponType: Math.floor(Math.random() * 4), // 0: knife, 1: axe, 2: battleaxe, 3: sword
  });
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json(
        { message: "Unauthorized" },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { country } = body;

    if (!country) {
      return NextResponse.json(
        { message: "Country is required" },
        { status: 400 }
      );
    }

    // Check if user has enough points
    const user = await db.user.findUnique({
      where: {
        id: session.user.id,
      },
      select: {
        pointsBalance: true,
      },
    });

    if (!user) {
      return NextResponse.json(
        { message: "User not found" },
        { status: 404 }
      );
    }

    if (user.pointsBalance < 1) {
      return NextResponse.json(
        { message: "Insufficient points to create a character" },
        { status: 400 }
      );
    }

    // Generate sprite data
    const spriteData = generateSpriteData(country);

    // Create character and update user points in a transaction
    const result = await db.$transaction(async (tx) => {
      // Create character
      const character = await tx.character.create({
        data: {
          userId: session.user.id,
          spriteData,
          country,
        },
      });

      // Deduct points from user
      const updatedUser = await tx.user.update({
        where: {
          id: session.user.id,
        },
        data: {
          pointsBalance: {
            decrement: 1,
          },
        },
      });

      // Record transaction
      await tx.transaction.create({
        data: {
          userId: session.user.id,
          amount: -1,
          type: "CHARACTER_CREATION",
          description: `Created character with country: ${country}`,
        },
      });

      return { character, updatedUser };
    });

    return NextResponse.json({
      message: "Character created successfully",
      character: result.character,
      pointsBalance: result.updatedUser.pointsBalance,
    });
  } catch (error) {
    console.error("Error creating character:", error);
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    );
  }
} 