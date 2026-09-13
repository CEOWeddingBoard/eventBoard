"use server"

import { prisma } from "@/lib/prisma"

export async function createUser(data: {
  email: string
  name?: string
  password?: string
}) {
  try {
    const newUser = await prisma.user.create({
      data: {
        email: data.email,
        name: data.name,
        password: data.password || "",
      },
    })
    return JSON.parse(JSON.stringify(newUser))
  } catch (error) {
    console.error("Error creating user:", error)
    throw new Error("Failed to create user")
  }
}

export async function getUserById(id: string) {
  try {
    const user = await prisma.user.findUnique({
      where: { id },
      include: {
        weddings: {
            include: {
                tasks: true,
                budget: true,
                guests: true
            }
        }
      },
    })
    if (!user) throw new Error("User not found")
    return JSON.parse(JSON.stringify(user))
  } catch (error) {
    console.error("Error getting user by ID:", error)
    throw new Error("Failed to get user")
  }
}
