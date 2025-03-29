export function generateAvatarUrl(firstName: string, lastName: string): string {
  const initials = `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
  const color = getRandomColor();
  return `https://api.dicebear.com/9.x/initials/svg?seed=${initials}&radius=50&backgroundType=solid,gradientLinear&background=${color}`;
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
