import { Router } from "express";
import { prisma } from "../prisma.js";
import { requireAuth } from "../middleware/auth.js";

const router = Router();

const reqInclude = {
  book: true,
  from: { select: { id: true, name: true, city: true } },
  to: { select: { id: true, name: true, city: true } },
};

// Small typed error so transaction bodies can bail out with a status code.
class HttpError extends Error {
  constructor(status, message) {
    super(message);
    this.status = status;
  }
}
function fail(res, e) {
  if (e instanceof HttpError) return res.status(e.status).json({ error: e.message });
  console.error(e);
  return res.status(500).json({ error: "Something went wrong" });
}

/*
  The lending flow is fully two-sided and in-person. Asking happens in chat;
  only these tracked steps change a book's status:

  HANDOVER  (owner A -> receiver B)
    A taps "Hand over"        -> request(type=handover, from=A, to=B), book = Pending
    B taps "Accept" on receipt -> book = Lent out, held by B

  RETURN    (holder B -> owner A)
    B taps "Mark as returned"  -> request(type=return, from=B, to=A), book = Returning
    A taps "Confirm" on receipt -> book = Available, cleared

  The counterparty may Decline; the initiator may Cancel. Either reverts the book.
  Every transition uses a conditional update so two racing taps can't double-apply.
*/

// GET all requests relevant to me, split incoming / outgoing
router.get("/", requireAuth, async (req, res) => {
  const me = req.user.id;

  const incoming = await prisma.lendingRequest.findMany({
    where: { toId: me, status: "Pending" },
    include: reqInclude,
    orderBy: { createdAt: "desc" },
  });

  const outgoing = await prisma.lendingRequest.findMany({
    where: { fromId: me, status: "Pending" },
    include: reqInclude,
    orderBy: { createdAt: "desc" },
  });

  // My books currently lent out (read-only info in Outgoing)
  const lentOut = await prisma.book.findMany({
    where: { ownerId: me, status: "Lent out" },
  });

  res.json({ incoming, outgoing, lentOut });
});

// Books I'm currently holding that belong to someone else (so I can return them)
router.get("/holding", requireAuth, async (req, res) => {
  const me = req.user.id;
  const books = await prisma.book.findMany({
    where: { heldById: me, ownerId: { not: me }, status: { in: ["Lent out", "Returning"] } },
    include: { owner: { select: { id: true, name: true, city: true } } },
    orderBy: { title: "asc" },
  });
  res.json({ books });
});

// Owner hands a book to someone -> handover request; receiver confirms on receipt
router.post("/give", requireAuth, async (req, res) => {
  const { bookId, toUserId } = req.body;
  if (toUserId === req.user.id)
    return res.status(400).json({ error: "You can't hand a book to yourself" });

  const receiver = await prisma.user.findUnique({ where: { id: toUserId } });
  if (!receiver) return res.status(404).json({ error: "User not found" });

  try {
    const request = await prisma.$transaction(async (tx) => {
      const book = await tx.book.findUnique({ where: { id: bookId } });
      if (!book || book.ownerId !== req.user.id)
        throw new HttpError(404, "Book not found on your shelf");

      // Conditional update: only flips if the book is still Available, so two
      // concurrent gives can't both succeed.
      const claimed = await tx.book.updateMany({
        where: { id: bookId, status: "Available" },
        data: { status: "Pending", heldById: receiver.id, heldByName: receiver.name },
      });
      if (claimed.count === 0) throw new HttpError(400, "Book is not available");

      return tx.lendingRequest.create({
        data: { bookId, fromId: req.user.id, toId: receiver.id, type: "handover" },
        include: reqInclude,
      });
    });
    res.json({ request });
  } catch (e) {
    fail(res, e);
  }
});

// Holder initiates a return -> owner confirms once the book is back in hand
router.post("/return", requireAuth, async (req, res) => {
  const { bookId } = req.body;
  try {
    const request = await prisma.$transaction(async (tx) => {
      const book = await tx.book.findUnique({ where: { id: bookId } });
      if (!book) throw new HttpError(404, "Book not found");
      if (book.heldById !== req.user.id)
        throw new HttpError(400, "You are not holding this book");

      // Guard against duplicate open return requests
      const existing = await tx.lendingRequest.findFirst({
        where: { bookId, type: "return", status: "Pending" },
      });
      if (existing) throw new HttpError(400, "A return is already pending");

      const claimed = await tx.book.updateMany({
        where: { id: bookId, heldById: req.user.id, status: "Lent out" },
        data: { status: "Returning" },
      });
      if (claimed.count === 0) throw new HttpError(400, "This book isn't ready to return");

      return tx.lendingRequest.create({
        data: { bookId, fromId: req.user.id, toId: book.ownerId, type: "return" },
        include: reqInclude,
      });
    });
    res.json({ request });
  } catch (e) {
    fail(res, e);
  }
});

// Accept / confirm a request (behaviour depends on type) — counterparty only
router.post("/:id/accept", requireAuth, async (req, res) => {
  try {
    const updated = await prisma.$transaction(async (tx) => {
      const request = await tx.lendingRequest.findUnique({
        where: { id: req.params.id },
        include: { book: true },
      });
      if (!request || request.toId !== req.user.id)
        throw new HttpError(404, "Request not found");

      // Claim the request first; if a racing accept/decline/cancel already moved
      // it off Pending, count is 0 and we bail before touching the book.
      const claimed = await tx.lendingRequest.updateMany({
        where: { id: request.id, status: "Pending" },
        data: { status: "Accepted" },
      });
      if (claimed.count === 0) throw new HttpError(400, "Already handled");

      if (request.type === "handover") {
        // Receiver confirms they physically got the book -> Lent out, held by me
        await tx.book.update({
          where: { id: request.bookId },
          data: { status: "Lent out", heldById: req.user.id, heldByName: req.user.name },
        });
      } else if (request.type === "return") {
        // Owner confirms the book is back in hand -> Available
        await tx.book.update({
          where: { id: request.bookId },
          data: { status: "Available", heldById: null, heldByName: null },
        });
      }

      return tx.lendingRequest.findUnique({ where: { id: request.id }, include: reqInclude });
    });
    res.json({ request: updated });
  } catch (e) {
    fail(res, e);
  }
});

// Decline a request -> revert book to its prior state — counterparty only
router.post("/:id/decline", requireAuth, async (req, res) => {
  try {
    const updated = await prisma.$transaction(async (tx) => {
      const request = await tx.lendingRequest.findUnique({
        where: { id: req.params.id },
        include: { book: true },
      });
      if (!request || request.toId !== req.user.id)
        throw new HttpError(404, "Request not found");

      const claimed = await tx.lendingRequest.updateMany({
        where: { id: request.id, status: "Pending" },
        data: { status: "Declined" },
      });
      if (claimed.count === 0) throw new HttpError(400, "Already handled");

      if (request.type === "handover") {
        // Receipt never happened -> book stays with owner
        await tx.book.update({
          where: { id: request.bookId },
          data: { status: "Available", heldById: null, heldByName: null },
        });
      } else if (request.type === "return") {
        // Owner hasn't got it back yet -> stays with the holder
        await tx.book.update({ where: { id: request.bookId }, data: { status: "Lent out" } });
      }

      return tx.lendingRequest.findUnique({ where: { id: request.id }, include: reqInclude });
    });
    res.json({ request: updated });
  } catch (e) {
    fail(res, e);
  }
});

// Cancel / withdraw a request I initiated -> revert book — initiator only.
// This is what frees a book stuck in Pending/Returning when the other side ghosts.
router.post("/:id/cancel", requireAuth, async (req, res) => {
  try {
    const updated = await prisma.$transaction(async (tx) => {
      const request = await tx.lendingRequest.findUnique({
        where: { id: req.params.id },
        include: { book: true },
      });
      if (!request || request.fromId !== req.user.id)
        throw new HttpError(404, "Request not found");

      const claimed = await tx.lendingRequest.updateMany({
        where: { id: request.id, status: "Pending" },
        data: { status: "Cancelled" },
      });
      if (claimed.count === 0) throw new HttpError(400, "Already handled");

      if (request.type === "handover") {
        // Owner withdrew the offer -> book returns to their shelf
        await tx.book.update({
          where: { id: request.bookId },
          data: { status: "Available", heldById: null, heldByName: null },
        });
      } else if (request.type === "return") {
        // Holder cancels the return -> they keep holding it
        await tx.book.update({ where: { id: request.bookId }, data: { status: "Lent out" } });
      }

      return tx.lendingRequest.findUnique({ where: { id: request.id }, include: reqInclude });
    });
    res.json({ request: updated });
  } catch (e) {
    fail(res, e);
  }
});

export default router;
