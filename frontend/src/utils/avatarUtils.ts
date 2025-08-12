export function generateAvatarUrl(firstName: string, lastName: string): string {
  const initials = `${firstName?.charAt(0) || ''}${lastName?.charAt(0) || ''}`
    .toLowerCase();
  const seed = encodeURIComponent(initials);
  // Match the preferred DiceBear style
  // https://api.dicebear.com/9.x/initials/svg?seed=pt&radius=50&backgroundType=gradientLinear&fontSize=26&backgroundRotation=-205
  return `https://api.dicebear.com/9.x/initials/svg?seed=${seed}&radius=50&backgroundType=gradientLinear&fontSize=26&backgroundRotation=-205`;
}

const colors = [
  '#00acc1',
  '#1e88e5',
  '#5e35b1',
  '#7cb342',
  '#8e24aa',
  '#039be5',
  '#43a047',
  '#00897b',
  '#3949ab',
  '#c0ca33',
  '#d81b60',
  '#e53935',
  '#f4511e',
  '#fb8c00',
  '#fdd835',
  '#ffb300',
];

export function getRandomColor(): string {
  return colors[Math.floor(Math.random() * colors.length)];
}
