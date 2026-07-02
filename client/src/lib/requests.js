// Human-readable copy + action labels for lending requests.
// Shared by the Requests page and the inline request cards in Chats.

export function incomingCopy(r) {
  if (r.type === "handover")
    return {
      text: `${r.from.name} is handing you “${r.book.title}”. Confirm once it's in your hands?`,
      accept: "Confirm receipt",
      badge: "Pending",
      meta: `In person · ${r.from.city}`,
    };
  // return — I'm the owner getting my book back
  return {
    text: `${r.from.name} is returning “${r.book.title}” to you. Confirm once you have it back?`,
    accept: "Confirm return",
    badge: "Returning",
    meta: `In person · ${r.from.city}`,
  };
}

export function outgoingCopy(r) {
  if (r.type === "handover")
    return {
      text: `You’re handing “${r.book.title}” to ${r.to.name}.`,
      meta: `Waiting for ${r.to.name} to confirm receipt · ${r.to.city}`,
    };
  // return — I'm the holder, waiting for the owner to confirm
  return {
    text: `You’re returning “${r.book.title}” to ${r.to.name}.`,
    meta: `Waiting for ${r.to.name} to confirm · ${r.to.city}`,
  };
}
