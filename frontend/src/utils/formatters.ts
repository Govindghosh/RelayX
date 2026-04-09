export function formatMessageTimestamp(value: string): string {
  return new Date(value).toLocaleString();
}

export function formatCompactId(value: string): string {
  return `${value.slice(0, 8)}...${value.slice(-4)}`;
}
