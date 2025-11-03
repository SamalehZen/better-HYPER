"use client";

import useSWR from "swr";

const fetcher = async (url: string) => {
  const res = await fetch(url, { credentials: "same-origin" });
  if (!res.ok) return { user: null };
  return res.json();
};

export const authClient = {
  useSession() {
    const { data, isLoading } = useSWR<{ user: any }>(
      "/api/auth/session",
      fetcher,
    );
    return { data, isPending: isLoading } as const;
  },
};
