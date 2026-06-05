export const authKeys = {
  all: ["auth"] as const,
  me: () => [...authKeys.all, "me"] as const,
};

export const notesKeys = {
  all: ["notes"] as const,
  list: () => [...notesKeys.all, "list"] as const,
  detail: (id: number) => [...notesKeys.all, "detail", id] as const,
};
