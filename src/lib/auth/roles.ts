import { PERMISSION_TYPES } from "app-types/permissions";

const ALL = [...Object.values(PERMISSION_TYPES)];
const LIMITED = ["view", "use", "list"] as const;

type Perm = readonly string[];

type Role = {
  statements: {
    user?: Perm;
    session?: Perm;
    workflow?: Perm;
    agent?: Perm;
    mcp?: Perm;
    chat?: Perm;
    temporaryChat?: Perm;
    [key: string]: Perm | undefined;
  };
};

export const user: Role = {
  statements: {
    workflow: [...LIMITED],
    agent: [...LIMITED],
    mcp: [...LIMITED],
    chat: [...ALL],
    temporaryChat: [...ALL],
  },
};

export const editor: Role = {
  statements: {
    workflow: [...ALL],
    agent: [...ALL],
    mcp: ["create", "view", "update", "delete", "use", "list"],
    chat: [...ALL],
    temporaryChat: [...ALL],
  },
};

export const admin: Role = {
  statements: {
    user: [],
    session: [],
    workflow: [...ALL],
    agent: [...ALL],
    mcp: [...ALL],
    chat: [...ALL],
    temporaryChat: [...ALL],
  },
};
