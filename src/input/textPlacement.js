let textShapeCommitted = false;

export function resetTextToolPlacement() {
  textShapeCommitted = false;
}

export function isTextShapeCommitted() {
  return textShapeCommitted;
}

export function markTextShapeCommitted() {
  textShapeCommitted = true;
}
