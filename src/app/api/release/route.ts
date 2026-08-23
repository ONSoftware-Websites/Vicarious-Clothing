// Compatibility endpoint for older checkout cleanup calls. Passive bag checks no
// longer reserve stock; checkout stock is claimed only when an order is created.
export async function DELETE() {
  return Response.json({ ok: true });
}
