export function normalizeCustomerEmail(email: string) {
  return email.trim().toLowerCase();
}

export function formatCustomerName(firstName: string, lastName: string) {
  return `${firstName.trim()} ${lastName.trim()}`.trim();
}
