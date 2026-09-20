import { apiClient } from "@/api/client";
import type { User } from "@/types/user";

export async function getUsers(): Promise<User[]> {
  const { data } = await apiClient.get<User[]>("/api/users");
  return data;
}
