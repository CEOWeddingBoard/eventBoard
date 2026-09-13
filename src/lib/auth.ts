import { getCurrentUser } from "@/lib/auth/utils";

export const auth = async () => {
  const user = await getCurrentUser();

  return {
    userId: user?.id ?? null,
    user: user,
    sessionId: null,
    getToken: async () => null,
  };
};

export const currentUser = async () => {
  return await getCurrentUser();
};
