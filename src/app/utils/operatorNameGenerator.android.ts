export function generateRandomOperatorName() {
  return java.util.UUID.randomUUID().toString().substring(0, 8).toUpperCase();
}
