// =====================================================================
// The NEW GEN — LINE group notification for new enrollments
// Supabase Edge Function name: line-notify
//
// Two callers:
//   1) LINE webhook (header x-line-signature) — replies with the group ID when the
//      bot joins a group, or when someone types "groupid" in the group.
//   2) Database trigger (header x-notify-secret) — pushes a "new enrollment" message
//      to the group set in LINE_GROUP_ID.
//
// Secrets (Supabase → Edge Functions → Secrets):
//   LINE_CHANNEL_ACCESS_TOKEN, LINE_CHANNEL_SECRET, NOTIFY_SECRET, LINE_GROUP_ID
// =====================================================================
import { createHmac, timingSafeEqual } from "node:crypto";

const LINE_TOKEN = Deno.env.get("LINE_CHANNEL_ACCESS_TOKEN") ?? "";
const LINE_SECRET = Deno.env.get("LINE_CHANNEL_SECRET") ?? "";
const GROUP_ID = Deno.env.get("LINE_GROUP_ID") ?? "";
const NOTIFY_SECRET = Deno.env.get("NOTIFY_SECRET") ?? "";

type Subject = { name?: string; date?: string; time?: string };
type Enrollment = {
  id?: string;
  studentName?: string;
  grade?: string;
  courseId?: string;
  courseTitle?: string;
  learningType?: string;
  isCampaign?: boolean;
  isBundle?: boolean;
  bundleName?: string;
  selectedSubjects?: Subject[];
  subjectsChosen?: string;
  scheduleChoice?: string;
  createdAt?: string;
};
type Payload = {
  enrollment?: Enrollment;
  course?: { title?: string; subjects?: string } | null;
  bundle_courses?: string | null;
};

function safeEqual(a: string, b: string): boolean {
  const ab = new TextEncoder().encode(a);
  const bb = new TextEncoder().encode(b);
  return ab.length === bb.length && timingSafeEqual(ab, bb);
}

function validLineSignature(rawBody: string, signature: string): boolean {
  if (!LINE_SECRET || !signature) return false;
  const expected = createHmac("sha256", LINE_SECRET).update(rawBody).digest("base64");
  return safeEqual(expected, signature);
}

async function lineApi(path: "push" | "reply", body: unknown): Promise<boolean> {
  const res = await fetch(`https://api.line.me/v2/bot/message/${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${LINE_TOKEN}` },
    body: JSON.stringify(body),
  });
  if (!res.ok) console.error(`LINE ${path} failed`, res.status, await res.text());
  return res.ok;
}

// "ประเภท | เวลา | วันที่" → "ประเภท • เวลา • วันที่" (แพ็คเกจมีหลายบรรทัด แยกตามคอร์ส)
function formatRound(choice?: string): string {
  const lines = String(choice ?? "")
    .split("\n")
    .map((l) => l.replace(/\s*\|\s*/g, " • ").trim())
    .filter(Boolean);
  if (lines.length === 0) return "-";
  return lines.length === 1 ? lines[0] : "\n" + lines.map((l) => `   ${l.startsWith("•") ? l : "• " + l}`).join("\n");
}

function formatTime(iso?: string): string {
  const d = iso ? new Date(iso) : new Date();
  if (isNaN(d.getTime())) return "-";
  return d.toLocaleString("th-TH", { timeZone: "Asia/Bangkok", dateStyle: "medium", timeStyle: "short" });
}

export function formatMessage(p: Payload): string {
  const en = p.enrollment ?? {};
  const isCampaign = en.isCampaign === true || en.courseId === "campaign-free" || en.courseId === "campaign";
  const learning = String(en.learningType ?? "").toLowerCase() === "online" ? "💻 Online" : "🏫 Onsite";

  const lines = [
    isCampaign ? "🔔 มีผู้สมัครโครงการติวฟรีใหม่!" : "🔔 มีผู้สมัครคอร์สเรียนใหม่!",
    "",
    `👤 ชื่อ-สกุล: ${en.studentName || "-"}`,
    `🎓 ระดับชั้น: ${en.grade || "-"}`,
  ];

  if (isCampaign) {
    lines.push(`📚 คอร์ส: 🎁 ${en.courseTitle || "โครงการติวฟรี"}`);
    const subjects = Array.isArray(en.selectedSubjects) ? en.selectedSubjects : [];
    lines.push("📖 วิชา & รอบเวลา:");
    if (subjects.length > 0) {
      subjects.forEach((s) => {
        const when = [s.date, s.time].filter(Boolean).join(" ");
        lines.push(`   • ${s.name || "-"}${when ? ` (${when})` : ""}`);
      });
    } else {
      lines.push(`   • ${en.subjectsChosen || "-"}`);
    }
  } else if (en.isBundle) {
    lines.push(`📚 คอร์ส: 📦 แพ็คเกจ ${en.bundleName || en.courseTitle || "-"}`);
    lines.push(`📖 คอร์สในแพ็ค: ${p.bundle_courses || "-"}`);
    lines.push(`⏰ รอบเวลา: ${formatRound(en.scheduleChoice)}`);
  } else {
    lines.push(`📚 คอร์ส: ${p.course?.title || en.courseTitle || "-"}`);
    lines.push(`📖 วิชา: ${p.course?.subjects || "-"}`);
    lines.push(`⏰ รอบเวลา: ${formatRound(en.scheduleChoice)}`);
  }

  lines.push(`🏷️ รูปแบบการเรียน: ${learning}`);
  lines.push("");
  lines.push(`🆔 ${en.id || "-"}`);
  lines.push(`🕒 ${formatTime(en.createdAt)}`);
  return lines.join("\n").slice(0, 4900);
}

async function handleLineWebhook(rawBody: string, signature: string): Promise<Response> {
  if (!validLineSignature(rawBody, signature)) return new Response("bad signature", { status: 401 });
  const body = JSON.parse(rawBody || "{}");
  for (const ev of body.events ?? []) {
    const src = ev.source ?? {};
    const groupId = src.groupId ?? src.roomId;
    const asked = ev.type === "message" && ev.message?.type === "text" &&
      String(ev.message.text).trim().toLowerCase() === "groupid";
    // reply messages are free and do not use the monthly quota
    if (groupId && ev.replyToken && (ev.type === "join" || asked)) {
      await lineApi("reply", {
        replyToken: ev.replyToken,
        messages: [{
          type: "text",
          text: `Group ID ของกลุ่มนี้:\n${groupId}\n\nคัดลอกไปใส่ใน Supabase → Edge Functions → Secrets ชื่อ LINE_GROUP_ID`,
        }],
      });
    }
  }
  return new Response("ok");
}

Deno.serve(async (req: Request) => {
  if (req.method !== "POST") return new Response("ok");
  const rawBody = await req.text();

  const lineSignature = req.headers.get("x-line-signature");
  if (lineSignature !== null) return handleLineWebhook(rawBody, lineSignature);

  const secret = req.headers.get("x-notify-secret") ?? "";
  if (!NOTIFY_SECRET || !safeEqual(secret, NOTIFY_SECRET)) return new Response("unauthorized", { status: 401 });
  if (!LINE_TOKEN || !GROUP_ID) return new Response("LINE_CHANNEL_ACCESS_TOKEN / LINE_GROUP_ID not set", { status: 500 });

  const payload = JSON.parse(rawBody || "{}") as Payload;
  const ok = await lineApi("push", { to: GROUP_ID, messages: [{ type: "text", text: formatMessage(payload) }] });
  return new Response(ok ? "sent" : "line error", { status: ok ? 200 : 502 });
});
