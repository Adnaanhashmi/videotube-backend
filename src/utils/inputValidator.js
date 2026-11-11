function cleanString(input) {
  if (typeof input === "number") {
    return input.toString().trim()
  }
  if (typeof input !== "string") return undefined
  const trimmed = input.trim()
  return trimmed || undefined
}

export default cleanString