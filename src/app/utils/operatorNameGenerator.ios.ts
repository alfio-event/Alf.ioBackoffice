export function generateRandomOperatorName(): string {
  const uuid: string = NSUUID.UUID().UUIDString;
  return uuid.substring(0, 8).toUpperCase();
}
