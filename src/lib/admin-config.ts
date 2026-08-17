export function adminEnabled() {
  return Boolean(process.env.ADMIN_PASSWORD);
}
