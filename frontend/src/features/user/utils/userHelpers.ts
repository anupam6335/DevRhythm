export const getUserDisplayName = (user: { displayName?: string; username: string }) => {
  return user.displayName || user.username;
};

// More helpers can be added later