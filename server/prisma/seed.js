import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

const COVERS = ["sage", "lavender", "beige", "terracotta", "slate"];
const cover = (i) => COVERS[i % COVERS.length];

async function main() {
  console.log("Clearing existing data...");
  await prisma.lendingRequest.deleteMany();
  await prisma.message.deleteMany();
  await prisma.communityMember.deleteMany();
  await prisma.community.deleteMany();
  await prisma.book.deleteMany();
  await prisma.user.deleteMany();

  const pw = await bcrypt.hash("raj123", 10);
  const pwOther = await bcrypt.hash("password", 10);

  console.log("Creating users...");
  // 12 users across Rajkot, Ahmedabad, Surat
  const usersData = [
    { name: "Raj", email: "raj@bookswap.in", city: "Rajkot", bio: "Reader of philosophy and slow mornings. Always glad to swap a thoughtful non-fiction over coffee.", password: pw },
    { name: "Meera", email: "meera@bookswap.in", city: "Rajkot", bio: "Fiction lover and chai enthusiast.", password: pwOther },
    { name: "Aarav", email: "aarav@bookswap.in", city: "Rajkot", bio: "Into self-help and startups.", password: pwOther },
    { name: "Priya", email: "priya@bookswap.in", city: "Surat", bio: "Poetry and quiet evenings.", password: pwOther },
    { name: "Kavya", email: "kavya@bookswap.in", city: "Rajkot", bio: "History and biographies.", password: pwOther },
    { name: "Vikram", email: "vikram@bookswap.in", city: "Rajkot", bio: "Sci-fi and long train journeys.", password: pwOther },
    { name: "Neha", email: "neha@bookswap.in", city: "Rajkot", bio: "Books about focus and habits.", password: pwOther },
    { name: "Arjun", email: "arjun@bookswap.in", city: "Ahmedabad", bio: "Finance and mindset reads.", password: pwOther },
    { name: "Ishaan", email: "ishaan@bookswap.in", city: "Ahmedabad", bio: "Classics and cricket.", password: pwOther },
    { name: "Diya", email: "diya@bookswap.in", city: "Ahmedabad", bio: "Loves a good memoir.", password: pwOther },
    { name: "Rohan", email: "rohan@bookswap.in", city: "Surat", bio: "Thrillers and weekend swaps.", password: pwOther },
    { name: "Ananya", email: "ananya@bookswap.in", city: "Surat", bio: "Design, art and picture books.", password: pwOther },
  ];

  const users = {};
  let ui = 0;
  for (const u of usersData) {
    const created = await prisma.user.create({ data: u });
    users[u.name] = created;
    ui++;
  }

  console.log("Creating books...");
  // Helper to add a book
  let bi = 0;
  const addBook = async (title, author, ownerName, opts = {}) => {
    const b = await prisma.book.create({
      data: {
        title,
        author,
        ownerId: users[ownerName].id,
        condition: opts.condition || "Good",
        genre: opts.genre || "Non-fiction",
        cover: opts.cover || cover(bi++),
        status: opts.status || "Available",
        heldById: opts.heldById || null,
        heldByName: opts.heldByName || null,
      },
    });
    return b;
  };

  // Raj's shelf: 6 books, one lent out to Meera (Atomic Habits)
  await addBook("Do Epic Shit", "Ankur Warikoo", "Raj", { condition: "Good", cover: "lavender", genre: "Self-help" });
  await addBook("Sapiens", "Yuval Noah Harari", "Raj", { condition: "Good", cover: "sage", genre: "History" });
  await addBook("Man's Search for Meaning", "Viktor Frankl", "Raj", { condition: "Worn", cover: "beige", genre: "Philosophy" });
  await addBook("Atomic Habits", "James Clear", "Raj", {
    condition: "Good", cover: "sage", genre: "Self-help",
    status: "Lent out", heldById: users["Meera"].id, heldByName: "Meera",
  });
  await addBook("Deep Work", "Cal Newport", "Raj", { condition: "Good", cover: "terracotta", genre: "Productivity" });
  await addBook("The Almanack of Naval Ravikant", "Eric Jorgenson", "Raj", { condition: "New", cover: "beige", genre: "Philosophy" });

  // Karma owned in MULTIPLE cities so the city filter is obvious
  await addBook("Karma", "Sadhguru", "Meera", { cover: "beige", genre: "Spirituality" });   // Rajkot
  await addBook("Karma", "Sadhguru", "Kavya", { cover: "terracotta", genre: "Spirituality" }); // Rajkot
  await addBook("Karma", "Sadhguru", "Arjun", { cover: "sage", genre: "Spirituality" });     // Ahmedabad
  await addBook("Karma", "Sadhguru", "Priya", { cover: "lavender", genre: "Spirituality" });  // Surat

  // Other users' shelves — spread the well-known titles around
  await addBook("Atomic Habits", "James Clear", "Kavya", { condition: "New", cover: "sage", genre: "Self-help" });
  await addBook("The Alchemist", "Paulo Coelho", "Aarav", { cover: "terracotta", genre: "Fiction" });
  await addBook("The Alchemist", "Paulo Coelho", "Priya", { cover: "beige", genre: "Fiction" });
  await addBook("Ikigai", "Héctor García", "Meera", { cover: "sage", genre: "Self-help" });
  await addBook("Ikigai", "Héctor García", "Neha", { cover: "beige", genre: "Self-help" });
  await addBook("Wings of Fire", "A.P.J. Abdul Kalam", "Kavya", { cover: "slate", genre: "Biography" });
  await addBook("Wings of Fire", "A.P.J. Abdul Kalam", "Vikram", { cover: "sage", genre: "Biography" });
  await addBook("Rich Dad Poor Dad", "Robert Kiyosaki", "Aarav", { cover: "beige", genre: "Finance" });
  await addBook("Rich Dad Poor Dad", "Robert Kiyosaki", "Arjun", { cover: "terracotta", genre: "Finance" });
  await addBook("The Psychology of Money", "Morgan Housel", "Meera", { cover: "lavender", genre: "Finance" });
  await addBook("The Psychology of Money", "Morgan Housel", "Arjun", { cover: "beige", genre: "Finance" });
  await addBook("Sapiens", "Yuval Noah Harari", "Vikram", { cover: "sage", genre: "History" });
  await addBook("Deep Work", "Cal Newport", "Neha", { cover: "slate", genre: "Productivity" });
  await addBook("Do Epic Shit", "Ankur Warikoo", "Vikram", { cover: "lavender", genre: "Self-help" });

  // Fill out to 50+ books
  const extra = [
    ["The Monk Who Sold His Ferrari", "Robin Sharma", "Aarav", "Self-help"],
    ["The Power of Now", "Eckhart Tolle", "Priya", "Spirituality"],
    ["Think and Grow Rich", "Napoleon Hill", "Arjun", "Finance"],
    ["Meditations", "Marcus Aurelius", "Ishaan", "Philosophy"],
    ["The Subtle Art of Not Giving a F*ck", "Mark Manson", "Kavya", "Self-help"],
    ["Zero to One", "Peter Thiel", "Aarav", "Business"],
    ["The Lean Startup", "Eric Ries", "Vikram", "Business"],
    ["Educated", "Tara Westover", "Diya", "Memoir"],
    ["Becoming", "Michelle Obama", "Diya", "Memoir"],
    ["The Godfather", "Mario Puzo", "Ishaan", "Fiction"],
    ["1984", "George Orwell", "Ishaan", "Fiction"],
    ["To Kill a Mockingbird", "Harper Lee", "Ishaan", "Fiction"],
    ["The Great Gatsby", "F. Scott Fitzgerald", "Ananya", "Fiction"],
    ["Pride and Prejudice", "Jane Austen", "Ananya", "Fiction"],
    ["The Kite Runner", "Khaled Hosseini", "Rohan", "Fiction"],
    ["A Thousand Splendid Suns", "Khaled Hosseini", "Rohan", "Fiction"],
    ["Gone Girl", "Gillian Flynn", "Rohan", "Thriller"],
    ["The Girl on the Train", "Paula Hawkins", "Priya", "Thriller"],
    ["Steve Jobs", "Walter Isaacson", "Arjun", "Biography"],
    ["Shoe Dog", "Phil Knight", "Vikram", "Business"],
    ["Man's Search for Meaning", "Viktor Frankl", "Neha", "Philosophy"],
    ["The 5 AM Club", "Robin Sharma", "Neha", "Self-help"],
    ["Rework", "Jason Fried", "Aarav", "Business"],
    ["Hooked", "Nir Eyal", "Diya", "Business"],
    ["Range", "David Epstein", "Ishaan", "Non-fiction"],
    ["Outliers", "Malcolm Gladwell", "Kavya", "Non-fiction"],
    ["Blink", "Malcolm Gladwell", "Ananya", "Non-fiction"],
    ["Thinking, Fast and Slow", "Daniel Kahneman", "Arjun", "Psychology"],
    ["Ikigai", "Héctor García", "Rohan", "Self-help"],
    ["The Alchemist", "Paulo Coelho", "Diya", "Fiction"],
    ["Wings of Fire", "A.P.J. Abdul Kalam", "Ananya", "Biography"],
    ["The Psychology of Money", "Morgan Housel", "Neha", "Finance"],
    ["Karma", "Sadhguru", "Vikram", "Spirituality"],
    ["Atomic Habits", "James Clear", "Rohan", "Self-help"],
  ];
  for (const [t, a, owner, genre] of extra) {
    await addBook(t, a, owner, { genre });
  }

  console.log("Creating communities...");
  const communitiesData = [
    { name: "Rajkot Book Community", city: "Rajkot", members: ["Raj", "Meera", "Kavya", "Vikram", "Neha", "Aarav"] },
    { name: "Ahmedabad Readers Circle", city: "Ahmedabad", members: ["Arjun", "Ishaan", "Diya"] },
    { name: "Surat Story Swap", city: "Surat", members: ["Priya", "Rohan", "Ananya"] },
    { name: "Timeless Classics", city: "All cities", members: ["Meera", "Arjun", "Priya", "Vikram", "Ishaan"] },
  ];
  const communities = {};
  for (const c of communitiesData) {
    const community = await prisma.community.create({
      data: { name: c.name, city: c.city },
    });
    communities[c.name] = community;
    for (const m of c.members) {
      await prisma.communityMember.create({
        data: { communityId: community.id, userId: users[m].id },
      });
    }
  }

  console.log("Creating community chats...");
  const mkCommMsg = async (communityName, senderName, body) => {
    await prisma.communityMessage.create({
      data: {
        communityId: communities[communityName].id,
        senderId: users[senderName].id,
        body,
      },
    });
  };
  // Rajkot Book Community group chat (Raj is a member, so he sees this immediately)
  await mkCommMsg("Rajkot Book Community", "Meera", "Morning readers! Anyone finished Ikigai? Happy to pass my copy along.");
  await mkCommMsg("Rajkot Book Community", "Kavya", "I have Atomic Habits going spare this week if someone wants it.");
  await mkCommMsg("Rajkot Book Community", "Vikram", "Thinking of a Sunday meetup at the Rajkot library café — who's in?");
  await mkCommMsg("Rajkot Book Community", "Raj", "Count me in for Sunday. I'll bring a couple of philosophy reads to swap.");
  await mkCommMsg("Rajkot Book Community", "Neha", "Perfect. I'll bring Deep Work for whoever's been asking about it.");
  // A little life in the other communities too
  await mkCommMsg("Ahmedabad Readers Circle", "Arjun", "New month, new stack. What's everyone reading?");
  await mkCommMsg("Ahmedabad Readers Circle", "Diya", "Halfway through Educated — it's superb.");
  await mkCommMsg("Timeless Classics", "Ishaan", "Starting a slow read of The Godfather. Join if you like.");

  console.log("Creating chats...");
  // 3 pre-filled conversations for Raj: with Meera, Aarav, Priya
  const raj = users["Raj"];
  const mkMsg = async (from, to, body) => {
    await prisma.message.create({
      data: { senderId: users[from].id, receiverId: users[to].id, body },
    });
  };

  // Meera <-> Raj
  await mkMsg("Meera", "Raj", "Hi Raj! Saw you're after Karma — I've got a copy in good condition.");
  await mkMsg("Raj", "Meera", "That would be perfect. I have Atomic Habits to swap if you'd like it.");
  await mkMsg("Meera", "Raj", "Yes please, I've been meaning to read that one.");
  await mkMsg("Meera", "Raj", "Can you bring Karma? I have Atomic Habits for you — XYZ Cafe, Sunday 5pm?");
  await mkMsg("Raj", "Meera", "Sunday 5pm at XYZ Cafe works. See you then — I'll keep an eye out for the green door.");

  // Aarav <-> Raj
  await mkMsg("Aarav", "Raj", "Hey, is The Alchemist still available?");
  await mkMsg("Raj", "Aarav", "It is! When suits you?");
  await mkMsg("Aarav", "Raj", "Sure, The Alchemist is yours. Where should we meet?");

  // Priya <-> Raj
  await mkMsg("Priya", "Raj", "Thanks for the swap! Loved Ikigai.");
  await mkMsg("Raj", "Priya", "So glad! Let me know what you pick up next.");

  console.log("Creating lending requests...");
  // Helpers to set a book's live status and open a matching request.
  const setBook = (id, data) => prisma.book.update({ where: { id }, data });
  const findBook = (title, ownerName) =>
    prisma.book.findFirst({ where: { title, ownerId: users[ownerName].id } });
  const openRequest = (bookId, fromName, toName, type) =>
    prisma.lendingRequest.create({
      data: { bookId, fromId: users[fromName].id, toId: users[toName].id, type, status: "Pending" },
    });

  // ---- INCOMING for Raj (things Raj must confirm) ----

  // 1) Meera is handing Raj "Ikigai" -> Raj confirms receipt. (Ikigai is Meera's book, now Pending with Raj)
  const ikigaiMeera = await findBook("Ikigai", "Meera");
  await setBook(ikigaiMeera.id, { status: "Pending", heldById: raj.id, heldByName: "Raj" });
  await openRequest(ikigaiMeera.id, "Meera", "Raj", "handover");

  // 2) Aarav is returning Raj's "Sapiens" -> Raj confirms once it's back. (Sapiens is Raj's, out with Aarav, now Returning)
  const sapiensRaj = await findBook("Sapiens", "Raj");
  await setBook(sapiensRaj.id, { status: "Returning", heldById: users["Aarav"].id, heldByName: "Aarav" });
  await openRequest(sapiensRaj.id, "Aarav", "Raj", "return");

  // ---- OUTGOING for Raj (things Raj started, awaiting the other side) ----

  // 3) Raj is handing "Do Epic Shit" to Kavya -> awaiting Kavya's receipt. (Raj's book, now Pending with Kavya)
  const doEpicRaj = await findBook("Do Epic Shit", "Raj");
  await setBook(doEpicRaj.id, { status: "Pending", heldById: users["Kavya"].id, heldByName: "Kavya" });
  await openRequest(doEpicRaj.id, "Raj", "Kavya", "handover");

  // 4) Raj is returning Kavya's "Karma" -> awaiting Kavya's confirmation. (Kavya's book, out with Raj, now Returning)
  const karmaKavya = await findBook("Karma", "Kavya");
  await setBook(karmaKavya.id, { status: "Returning", heldById: raj.id, heldByName: "Raj" });
  await openRequest(karmaKavya.id, "Raj", "Kavya", "return");

  // ---- A book Raj is simply holding (borrowing) so he can start a fresh return ----
  // Priya's "The Alchemist" is out with Raj -> shows under "Books you're borrowing".
  const alchemistPriya = await findBook("The Alchemist", "Priya");
  await setBook(alchemistPriya.id, { status: "Lent out", heldById: raj.id, heldByName: "Raj" });

  const counts = {
    users: await prisma.user.count(),
    books: await prisma.book.count(),
    communities: await prisma.community.count(),
    messages: await prisma.message.count(),
    communityMessages: await prisma.communityMessage.count(),
    requests: await prisma.lendingRequest.count(),
  };
  console.log("Seed complete:", counts);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
