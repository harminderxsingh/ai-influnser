const express = require("express");
const path = require("path");
const router = express.Router();
const { query } = require("../database/connection");
const validateUser = require("../middlewares/user");
const { checkPlan } = require("../middlewares/common");
const { logUsage, downloadImage } = require("../utils/common");
const { generateTextContent, createJob, fetchJobStatus } = require("../loops/api");
const { getActiveProvider } = require("../utils/aiProvider");

const MIN_PAGES = 5;
const MAX_PAGES = 20;
const GENRES = [
  "Fiction",
  "Romance",
  "Mystery",
  "Self-help",
  "Business",
  "Children",
  "Fantasy",
  "Biography",
  "Educational",
  "Motivational",
];

async function getCreditPerPage() {
  const [web] = await query(`SELECT book_writer_maker FROM web_private`);
  return parseInt(web?.book_writer_maker || 2, 10);
}

async function reserveCredits(uid, fee) {
  const result = await query(
    `UPDATE user SET credits = credits - ? WHERE uid = ? AND credits >= ?`,
    [fee, uid, fee],
  );
  return result.affectedRows > 0;
}

async function refundCredits(uid, fee) {
  await query(`UPDATE user SET credits = credits + ? WHERE uid = ?`, [
    fee,
    uid,
  ]);
}

function cleanText(value, fallback = "") {
  return typeof value === "string" && value.trim() ? value.trim() : fallback;
}

function safeParseJsonArray(text) {
  if (!text) return null;
  const raw = String(text).trim();
  try {
    const direct = JSON.parse(raw);
    return Array.isArray(direct) ? direct : null;
  } catch {
    // ignore
  }
  const fence = raw.match(/```(?:json)?\s*([\s\S]*?)```/i);
  if (fence?.[1]) {
    try {
      const parsed = JSON.parse(fence[1].trim());
      return Array.isArray(parsed) ? parsed : null;
    } catch {
      // ignore
    }
  }
  const start = raw.indexOf("[");
  const end = raw.lastIndexOf("]");
  if (start >= 0 && end > start) {
    try {
      const parsed = JSON.parse(raw.slice(start, end + 1));
      return Array.isArray(parsed) ? parsed : null;
    } catch {
      return null;
    }
  }
  return null;
}

function splitIntoPages(text, pageCount) {
  const clean = String(text || "")
    .replace(/\r/g, "")
    .trim();
  if (!clean) return [];
  const paragraphs = clean.split(/\n{2,}/).map((p) => p.trim()).filter(Boolean);
  if (paragraphs.length >= pageCount) {
    const pages = [];
    const per = Math.ceil(paragraphs.length / pageCount);
    for (let i = 0; i < pageCount; i++) {
      const chunk = paragraphs.slice(i * per, (i + 1) * per).join("\n\n");
      if (chunk) pages.push(chunk);
    }
    return pages.slice(0, pageCount);
  }
  // Fallback: character chunks
  const size = Math.ceil(clean.length / pageCount);
  const pages = [];
  for (let i = 0; i < pageCount; i++) {
    const part = clean.slice(i * size, (i + 1) * size).trim();
    if (part) pages.push(part);
  }
  return pages;
}

async function buildOutline({ title, genre, pageCount, language, tone, synopsis }) {
  const result = await generateTextContent(null, {
    contentType: "blog",
    tone,
    language,
    topic: `Create an outline for a ${pageCount}-page book.
Title: ${title}
Genre: ${genre}
Synopsis: ${synopsis}
Return ONLY a JSON array with exactly ${pageCount} objects.
Each object must have: "page" (number 1..${pageCount}), "heading" (short page title), "summary" (1 sentence of what happens on that page).
No markdown, no commentary.`,
  });

  if (result.status !== "success") {
    return { ok: false, msg: result.msg || "Outline failed" };
  }

  const arr = safeParseJsonArray(result.data.content);
  if (!arr || !arr.length) {
    // synthesize simple headings
    const fallback = Array.from({ length: pageCount }, (_, i) => ({
      page: i + 1,
      heading: i === 0 ? "Beginning" : i === pageCount - 1 ? "Ending" : `Chapter moment ${i + 1}`,
      summary: `Continue the story for page ${i + 1} of "${title}".`,
    }));
    return { ok: true, outline: fallback, provider: result.data.provider };
  }

  const outline = Array.from({ length: pageCount }, (_, i) => {
    const item = arr.find((a) => Number(a.page) === i + 1) || arr[i] || {};
    return {
      page: i + 1,
      heading: cleanText(item.heading || item.title, `Page ${i + 1}`),
      summary: cleanText(item.summary, `Develop the story on page ${i + 1}.`),
    };
  });

  return { ok: true, outline, provider: result.data.provider };
}

async function writePage({
  title,
  genre,
  language,
  tone,
  synopsis,
  pageCount,
  pageMeta,
  previousText,
}) {
  const result = await generateTextContent(null, {
    contentType: "blog",
    tone,
    language,
    topic: `You are writing page ${pageMeta.page} of ${pageCount} for the book "${title}" (${genre}).
Page heading: ${pageMeta.heading}
Page goal: ${pageMeta.summary}
Book synopsis: ${synopsis}
${previousText ? `End of previous page (continue naturally):\n${previousText.slice(-500)}` : "This is the opening page."}

Write ONLY the page body text (about 220–320 words). No page numbers, no "Page X", no markdown headings unless natural. Make it readable as a printed book page.`,
  });

  if (result.status !== "success") {
    return { ok: false, msg: result.msg || "Page generation failed" };
  }

  return {
    ok: true,
    content: String(result.data.content || "").trim(),
    provider: result.data.provider,
  };
}

async function generateBookContent(bookRow) {
  const pageCount = Number(bookRow.page_count) || 8;
  const title = bookRow.title;
  const genre = bookRow.genre;
  const language = bookRow.language || "English";
  const tone = bookRow.tone || "engaging";
  const synopsis = bookRow.synopsis;

  const outlineRes = await buildOutline({
    title,
    genre,
    pageCount,
    language,
    tone,
    synopsis,
  });
  if (!outlineRes.ok) {
    throw new Error(outlineRes.msg);
  }

  const pages = [];
  let previousText = "";
  let providerName = outlineRes.provider || "";

  for (const pageMeta of outlineRes.outline) {
    const pageRes = await writePage({
      title,
      genre,
      language,
      tone,
      synopsis,
      pageCount,
      pageMeta,
      previousText,
    });

    if (!pageRes.ok) {
      // soft fallback: one bulk generation then split
      const bulk = await generateTextContent(null, {
        contentType: "blog",
        tone,
        language,
        topic: `Write a complete short book titled "${title}" (${genre}) in about ${pageCount} short sections/pages.
Synopsis: ${synopsis}
Separate each page with a line that says exactly: ===PAGE===
Each page ~220 words. Language: ${language}.`,
      });
      if (bulk.status !== "success") {
        throw new Error(pageRes.msg || bulk.msg || "Book generation failed");
      }
      const parts = String(bulk.data.content || "")
        .split(/===PAGE===/i)
        .map((p) => p.trim())
        .filter(Boolean);
      const split =
        parts.length >= Math.ceil(pageCount / 2)
          ? parts.slice(0, pageCount)
          : splitIntoPages(bulk.data.content, pageCount);
      return {
        pages: split.map((content, i) => ({
          page: i + 1,
          heading: outlineRes.outline[i]?.heading || `Page ${i + 1}`,
          content,
        })),
        provider: bulk.data.provider || providerName,
      };
    }

    providerName = pageRes.provider || providerName;
    previousText = pageRes.content;
    pages.push({
      page: pageMeta.page,
      heading: pageMeta.heading,
      content: pageRes.content,
    });
  }

  return { pages, provider: providerName };
}

function buildCoverPrompt(book) {
  const title = cleanText(book.title, "Untitled");
  const author = cleanText(book.author_name, "Anonymous");
  const genre = cleanText(book.genre, "Fiction");
  const synopsis = cleanText(book.synopsis, "").slice(0, 280);
  return `Professional hardcover book cover design, vertical portrait layout.
Title prominently displayed as elegant typography: "${title}"
Author credit: "${author}"
Genre mood: ${genre}.
Story mood: ${synopsis || genre}.
Cinematic illustration matching the story, rich colors, premium publishing quality, centered composition, readable title text on the cover, no barcode, no watermark, no stock photo look.`;
}

/**
 * Generate AI cover via active txt2img provider. Soft-fails (returns null).
 */
async function generateBookCover(book) {
  try {
    const provider = await getActiveProvider("txt2img");
    if (!provider?.txt2img_enabled) return null;

    const prompt = buildCoverPrompt(book);
    const created = await createJob(provider, "txt2img", { prompt });
    if (created.status !== "success" || !created.taskId) {
      console.warn("Book cover create failed:", created.msg);
      return null;
    }

    const status = await fetchJobStatus(provider, "txt2img", created.taskId);
    if (status.status !== "success" || !status.data) {
      console.warn("Book cover status failed:", status.msg);
      return null;
    }

    const fileName = await downloadImage(
      status.data,
      path.join(__dirname, "../client/public/media"),
    );
    return fileName || null;
  } catch (err) {
    console.warn("Book cover generation skipped:", err.message);
    return null;
  }
}

async function runBookJob(bookId, uid, fee) {
  try {
    const rows = await query(`SELECT * FROM books WHERE id = ? AND uid = ?`, [
      bookId,
      uid,
    ]);
    const book = rows?.[0];
    if (!book) return;

    // Cover + pages in parallel-ish: cover first (faster sync image), then pages
    const coverPromise = generateBookCover(book);
    const { pages, provider } = await generateBookContent(book);
    const coverImage = await coverPromise;

    await query(
      `UPDATE books SET pages = ?, cover_image = COALESCE(?, cover_image), status = 'success', provider = ?, error_msg = NULL WHERE id = ? AND uid = ?`,
      [
        JSON.stringify(pages),
        coverImage || null,
        provider || null,
        bookId,
        uid,
      ],
    );

    await logUsage({
      uid,
      task: "book_writer_maker",
      credits: fee,
      status: "success",
      des: `Book #${bookId} (${book.page_count} pages)${coverImage ? " + AI cover" : ""}`,
    });
  } catch (err) {
    console.log("Book generation failed:", err);
    await refundCredits(uid, fee);
    await query(
      `UPDATE books SET status = 'error', error_msg = ? WHERE id = ? AND uid = ?`,
      [err.message || "Generation failed", bookId, uid],
    );
    await logUsage({
      uid,
      task: "book_writer_maker",
      credits: fee,
      status: "refunded",
      des: err.message || "Book generation failed",
    });
  }
}

router.get("/meta", validateUser, async (req, res) => {
  try {
    const perPage = await getCreditPerPage();
    res.json({
      success: true,
      data: {
        genres: GENRES,
        minPages: MIN_PAGES,
        maxPages: MAX_PAGES,
        creditsPerPage: perPage,
      },
    });
  } catch (err) {
    console.log(err);
    res.json({ success: false, msg: "Something went wrong" });
  }
});

router.get("/get_all", validateUser, async (req, res) => {
  try {
    const rows = await query(
      `SELECT id, title, author_name, genre, language, tone, page_count, synopsis,
              cover_image, status, credits, provider, error_msg, createdAt
       FROM books WHERE uid = ? ORDER BY id DESC LIMIT 100`,
      [req.decode.uid],
    );
    res.json({ success: true, data: rows || [] });
  } catch (err) {
    console.log(err);
    res.json({ success: false, msg: "Something went wrong", data: [] });
  }
});

router.get("/get_one/:id", validateUser, async (req, res) => {
  try {
    const rows = await query(
      `SELECT * FROM books WHERE id = ? AND uid = ? LIMIT 1`,
      [req.params.id, req.decode.uid],
    );
    if (!rows?.length) {
      return res.json({ success: false, msg: "Book not found" });
    }
    const book = rows[0];
    if (typeof book.pages === "string") {
      try {
        book.pages = JSON.parse(book.pages);
      } catch {
        book.pages = [];
      }
    }
    res.json({ success: true, data: book });
  } catch (err) {
    console.log(err);
    res.json({ success: false, msg: "Something went wrong" });
  }
});

router.post("/create", validateUser, checkPlan, async (req, res) => {
  try {
    const uid = req.decode.uid;
    const title = cleanText(req.body.title);
    const authorName = cleanText(req.body.authorName, "Anonymous");
    const genre = cleanText(req.body.genre, "Fiction");
    const language = cleanText(req.body.language, "English");
    const tone = cleanText(req.body.tone, "engaging");
    const synopsis = cleanText(req.body.synopsis);
    let pageCount = parseInt(req.body.pageCount, 10);

    if (!title) {
      return res.json({ success: false, msg: "Book title is required" });
    }
    if (!synopsis) {
      return res.json({
        success: false,
        msg: "Please describe what the book is about",
      });
    }
    if (!Number.isFinite(pageCount)) pageCount = 8;
    pageCount = Math.max(MIN_PAGES, Math.min(MAX_PAGES, pageCount));

    const perPage = await getCreditPerPage();
    const fee = perPage * pageCount;

    const reserved = await reserveCredits(uid, fee);
    if (!reserved) {
      return res.json({
        success: false,
        msg: "Not enough credits",
        creditsNeeded: fee,
      });
    }

    await logUsage({
      uid,
      task: "book_writer_maker",
      credits: fee,
      status: "reserved",
      des: `Book "${title}" (${pageCount} pages)`,
    });

    const insert = await query(
      `INSERT INTO books
        (uid, title, author_name, genre, language, tone, page_count, synopsis, pages, credits, status)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'processing')`,
      [
        uid,
        title,
        authorName,
        genre,
        language,
        tone,
        pageCount,
        synopsis,
        JSON.stringify([]),
        fee,
      ],
    );

    const bookId = insert.insertId;

    // Background generation so UI can show flip-book progress
    setImmediate(() => runBookJob(bookId, uid, fee));

    res.json({
      success: true,
      msg: "Book is being written…",
      data: { id: bookId, credits: fee, pageCount },
    });
  } catch (err) {
    console.log(err);
    res.json({ success: false, msg: "Something went wrong" });
  }
});

router.post("/delete", validateUser, async (req, res) => {
  try {
    const { id } = req.body;
    if (!id) return res.json({ success: false, msg: "ID required" });
    await query(`DELETE FROM books WHERE id = ? AND uid = ?`, [
      id,
      req.decode.uid,
    ]);
    res.json({ success: true, msg: "Deleted" });
  } catch (err) {
    console.log(err);
    res.json({ success: false, msg: "Something went wrong" });
  }
});

router.post("/update", validateUser, async (req, res) => {
  try {
    const uid = req.decode.uid;
    const id = parseInt(req.body.id, 10);
    if (!id) return res.json({ success: false, msg: "ID required" });

    const rows = await query(
      `SELECT id, status FROM books WHERE id = ? AND uid = ? LIMIT 1`,
      [id, uid],
    );
    if (!rows?.length) {
      return res.json({ success: false, msg: "Book not found" });
    }
    if (rows[0].status === "processing") {
      return res.json({
        success: false,
        msg: "Wait until the book finishes generating before editing",
      });
    }

    const title = cleanText(req.body.title);
    const authorName = cleanText(req.body.authorName, "Anonymous");
    const genre = cleanText(req.body.genre, "");
    const synopsis = cleanText(req.body.synopsis, "");
    let pages = req.body.pages;

    if (typeof pages === "string") {
      try {
        pages = JSON.parse(pages);
      } catch {
        return res.json({ success: false, msg: "Invalid pages payload" });
      }
    }
    if (!Array.isArray(pages) || !pages.length) {
      return res.json({ success: false, msg: "Pages are required" });
    }

    const normalized = pages.map((p, i) => ({
      page: Number(p.page) || i + 1,
      heading: cleanText(p.heading, `Page ${i + 1}`),
      content: typeof p.content === "string" ? p.content.trim() : "",
    }));

    await query(
      `UPDATE books SET
        title = COALESCE(NULLIF(?, ''), title),
        author_name = ?,
        genre = COALESCE(NULLIF(?, ''), genre),
        synopsis = COALESCE(?, synopsis),
        pages = ?,
        page_count = ?,
        status = 'success',
        error_msg = NULL
       WHERE id = ? AND uid = ?`,
      [
        title,
        authorName,
        genre,
        synopsis || null,
        JSON.stringify(normalized),
        normalized.length,
        id,
        uid,
      ],
    );

    const [updated] = await query(
      `SELECT * FROM books WHERE id = ? AND uid = ? LIMIT 1`,
      [id, uid],
    );
    if (updated && typeof updated.pages === "string") {
      try {
        updated.pages = JSON.parse(updated.pages);
      } catch {
        updated.pages = normalized;
      }
    }

    res.json({
      success: true,
      msg: "Book saved",
      data: updated || { id, pages: normalized },
    });
  } catch (err) {
    console.log(err);
    res.json({ success: false, msg: "Something went wrong" });
  }
});

module.exports = router;
