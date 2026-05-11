import { eq } from "drizzle-orm";
import { db } from "../../db/index.js";
import { profiles } from "../../db/schema.js";

export interface CreateProfileInput {
  userId: string;
  name?: string;
  goal: string;
  experience?: string;
  gender?: string;
  age?: number;
  height?: number;
  weight?: number;
  activity?: string;
}

export interface UpdateProfileInput {
  name?: string;
  goal?: string;
  experience?: string;
  gender?: string;
  age?: number;
  height?: number;
  weight?: number;
  activity?: string;
}

export async function getProfile(userId: string) {
  return db.query.profiles.findFirst({
    where: eq(profiles.userId, userId),
  });
}

export async function createProfile(data: CreateProfileInput) {
  const [profile] = await db
    .insert(profiles)
    .values({
      userId: data.userId,
      name: data.name ?? null,
      goal: data.goal,
      experience: data.experience ?? null,
      gender: data.gender ?? null,
      age: data.age ?? null,
      height: data.height ?? null,
      weight: data.weight ?? null,
      activity: data.activity ?? null,
    })
    .returning();

  return profile;
}

export async function updateProfile(userId: string, data: UpdateProfileInput) {
  const [updated] = await db
    .update(profiles)
    .set({ ...data, updatedAt: new Date() })
    .where(eq(profiles.userId, userId))
    .returning();

  return updated || null;
}
