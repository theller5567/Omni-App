export function generateAvatarUrl(firstName: string, lastName: string): string {
  const initials = `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
  return `https://avatars.dicebear.com/api/initials/${initials}.svg`;
} 