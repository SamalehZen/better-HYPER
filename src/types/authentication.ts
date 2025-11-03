export type LocalSession = {
  id: string;
  userId: string;
  token: string;
  expiresAt: Date;
  user: {
    id: string;
    name: string;
    email: string;
    image: string | null;
    role: string;
    banned: boolean | null;
    banReason: string | null;
    banExpires: Date | null;
    preferences: any;
  };
};

export type UserSession = LocalSession;
export type UserSessionUser = LocalSession["user"];
