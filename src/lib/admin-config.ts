export function adminEnabled() {
  // Admin is always gated — login is required even if no password is set.
  // If ADMIN_PASSWORD is missing, checkPassword will reject every attempt
  // until the owner sets one, rather than leaving the area open.
  return true;
}

export function hasAdminPassword() {
  return Boolean(process.env.ADMIN_PASSWORD);
}
