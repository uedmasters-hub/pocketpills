import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/Button";

type Role = "Clinician" | "Pharmacist" | "Support";

interface Thread {
  id: string;
  who: string;
  role: Role;
  preview: string;
  when: string;
  unread: boolean;
  tone: string;
}

interface ChatMessage {
  id: string;
  from: "them" | "you";
  body: string;
  at: string;
}

const THREADS: Thread[] = [
  {
    id: "clinician",
    who: "Dr. Amrita Shah",
    role: "Clinician",
    preview: "Your prescription is approved and sent to pharmacy.",
    when: "2h",
    unread: true,
    tone: "bg-[#E8E4FF] text-[color:var(--pp-violet)]",
  },
  {
    id: "pharmacy",
    who: "PocketPills Pharmacy",
    role: "Pharmacist",
    preview: "We're verifying your order #PP-RX-3391.",
    when: "1d",
    unread: false,
    tone: "bg-[color:var(--pp-primary-200)] text-[color:var(--pp-primary-950)]",
  },
  {
    id: "care",
    who: "Care Support",
    role: "Support",
    preview: "How was your recent delivery?",
    when: "3d",
    unread: false,
    tone: "bg-[color:var(--secondary-500)] text-[color:var(--secondary-900)]",
  },
];

const SEED: Record<string, ChatMessage[]> = {
  clinician: [
    {
      id: "c1",
      from: "them",
      body: "Hi Ramesh — I’ve reviewed your assessment. Your prescription is approved and sent to pharmacy.",
      at: "Today · 10:12",
    },
    {
      id: "c2",
      from: "you",
      body: "Thanks! How long until it ships?",
      at: "Today · 10:18",
    },
    {
      id: "c3",
      from: "them",
      body: "Usually 1–2 days after the pharmacy verifies. You’ll get tracking in Orders.",
      at: "Today · 10:21",
    },
  ],
  pharmacy: [
    {
      id: "p1",
      from: "them",
      body: "We’re verifying your order #PP-RX-3391 with your insurance. No action needed.",
      at: "Yesterday · 16:40",
    },
    {
      id: "p2",
      from: "you",
      body: "Perfect, thank you.",
      at: "Yesterday · 17:02",
    },
  ],
  care: [
    {
      id: "s1",
      from: "them",
      body: "How was your recent delivery? Reply anytime — we’re here 7 days a week.",
      at: "Mon · 09:04",
    },
  ],
};

function initials(name: string) {
  return name
    .split(" ")
    .filter(Boolean)
    .map((w) => w[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

function resolveThreadId(withParam: string | null, orderParam: string | null) {
  if (withParam && THREADS.some((t) => t.id === withParam)) return withParam;
  if (orderParam?.startsWith("PP-TR")) return "care";
  if (orderParam) return "pharmacy";
  return THREADS[0]?.id ?? "care";
}

export function Messages() {
  const nav = useNavigate();
  const [params, setParams] = useSearchParams();
  const withParam = params.get("with");
  const orderParam = params.get("order");

  const [activeId, setActiveId] = useState(() => resolveThreadId(withParam, orderParam));
  const [drafts, setDrafts] = useState<Record<string, ChatMessage[]>>(() =>
    Object.fromEntries(THREADS.map((t) => [t.id, [...(SEED[t.id] ?? [])]])),
  );
  const [unread, setUnread] = useState(() =>
    Object.fromEntries(THREADS.map((t) => [t.id, t.unread])),
  );
  const [compose, setCompose] = useState("");
  const [mobileShowChat, setMobileShowChat] = useState(Boolean(withParam || orderParam));
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const next = resolveThreadId(withParam, orderParam);
    setActiveId(next);
    setUnread((u) => ({ ...u, [next]: false }));
    if (withParam || orderParam) setMobileShowChat(true);
  }, [withParam, orderParam]);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [activeId, drafts[activeId]?.length]);

  const active = useMemo(() => THREADS.find((t) => t.id === activeId) ?? THREADS[0], [activeId]);
  const messages = drafts[activeId] ?? [];

  const openThread = (id: string) => {
    setActiveId(id);
    setUnread((u) => ({ ...u, [id]: false }));
    setMobileShowChat(true);
    const next = new URLSearchParams(params);
    next.set("with", id);
    setParams(next, { replace: true });
  };

  const send = () => {
    const body = compose.trim();
    if (!body) return;
    const msg: ChatMessage = {
      id: `local-${Date.now()}`,
      from: "you",
      body,
      at: "Just now",
    };
    setDrafts((d) => ({ ...d, [activeId]: [...(d[activeId] ?? []), msg] }));
    setCompose("");
  };

  const orderNote =
    orderParam && (activeId === "care" || activeId === "pharmacy")
      ? `About order ${orderParam}`
      : null;

  return (
    <div className="flex min-h-[calc(100dvh-12rem)] flex-col">
      <header className="mb-5 shrink-0 lg:mb-6">
        <p className="pp-caps text-[color:var(--pp-violet)]">Messages</p>
        <h1 className="mt-2 font-display text-3xl font-medium tracking-tight text-[color:var(--pp-primary-950)] md:text-4xl">
          Your care team
        </h1>
        <p className="mt-2 max-w-xl text-base text-ink-secondary">
          Message a pharmacist or clinician any day of the week — usually replies within a few hours.
        </p>
      </header>

      <div className="grid min-h-0 flex-1 overflow-hidden rounded-2xl border border-line bg-white lg:grid-cols-[minmax(16rem,22rem)_minmax(0,1fr)]">
        {/* Thread list */}
        <aside
          className={
            "flex min-h-[22rem] flex-col border-line lg:min-h-[32rem] lg:border-r " +
            (mobileShowChat ? "hidden lg:flex" : "flex")
          }
        >
          <div className="border-b border-line px-4 py-3.5">
            <p className="text-sm font-semibold text-[color:var(--pp-primary-950)]">Inbox</p>
            <p className="mt-0.5 text-2xs text-ink-tertiary">
              {Object.values(unread).filter(Boolean).length} unread
            </p>
          </div>
          <ul className="flex-1 overflow-y-auto p-2">
            {THREADS.map((t) => {
              const selected = t.id === activeId;
              return (
                <li key={t.id}>
                  <button
                    type="button"
                    onClick={() => openThread(t.id)}
                    className={
                      "flex w-full items-start gap-3 rounded-xl px-3 py-3 text-left transition-colors " +
                      (selected
                        ? "bg-[color:var(--pp-primary-200)]"
                        : "hover:bg-[color:var(--state-hover)]")
                    }
                  >
                    <span
                      className={`grid h-11 w-11 shrink-0 place-items-center rounded-full text-sm font-semibold ${t.tone}`}
                    >
                      {initials(t.who)}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="flex items-center justify-between gap-2">
                        <span className="truncate text-sm font-semibold text-[color:var(--pp-primary-950)]">
                          {t.who}
                        </span>
                        <span className="shrink-0 text-2xs text-ink-tertiary">{t.when}</span>
                      </span>
                      <span className="mt-0.5 block text-2xs text-ink-tertiary">{t.role}</span>
                      <span
                        className={
                          "mt-1 block truncate text-sm " +
                          (unread[t.id]
                            ? "font-medium text-[color:var(--pp-primary-950)]"
                            : "text-ink-tertiary")
                        }
                      >
                        {(drafts[t.id]?.at(-1)?.body ?? t.preview)}
                      </span>
                    </span>
                    {unread[t.id] && (
                      <span
                        className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-[color:var(--pp-violet)]"
                        aria-label="Unread"
                      />
                    )}
                  </button>
                </li>
              );
            })}
          </ul>
        </aside>

        {/* Conversation */}
        <section
          className={
            "flex min-h-[28rem] flex-col lg:min-h-[32rem] " +
            (mobileShowChat ? "flex" : "hidden lg:flex")
          }
        >
          <div className="flex items-center gap-3 border-b border-line px-4 py-3.5 sm:px-5">
            <button
              type="button"
              className="text-sm font-medium text-ink-tertiary hover:text-[color:var(--pp-primary-950)] lg:hidden"
              onClick={() => setMobileShowChat(false)}
            >
              ← Inbox
            </button>
            <span
              className={`grid h-10 w-10 shrink-0 place-items-center rounded-full text-sm font-semibold ${active.tone}`}
            >
              {initials(active.who)}
            </span>
            <div className="min-w-0 flex-1">
              <p className="truncate font-semibold text-[color:var(--pp-primary-950)]">{active.who}</p>
              <p className="truncate text-2xs text-ink-tertiary">
                {active.role}
                {orderNote ? ` · ${orderNote}` : " · Typically replies in a few hours"}
              </p>
            </div>
            {orderParam && (
              <button
                type="button"
                onClick={() => nav(`/orders/${orderParam}`)}
                className="hidden shrink-0 rounded-full border border-line px-3 py-1.5 text-2xs font-medium text-[color:var(--pp-primary-950)] transition-colors hover:bg-[color:var(--state-hover)] sm:inline-flex"
              >
                View order
              </button>
            )}
          </div>

          <div className="flex-1 space-y-3 overflow-y-auto bg-[color:var(--pp-page)]/40 px-4 py-5 sm:px-5">
            {orderParam && (
              <div className="mx-auto max-w-md rounded-2xl border border-line bg-white px-4 py-3 text-center text-2xs text-ink-secondary">
                Conversation linked to <span className="font-semibold text-[color:var(--pp-primary-950)]">{orderParam}</span>
              </div>
            )}
            {messages.map((m) => (
              <div
                key={m.id}
                className={"flex " + (m.from === "you" ? "justify-end" : "justify-start")}
              >
                <div
                  className={
                    "max-w-[min(100%,22rem)] rounded-2xl px-4 py-3 text-sm leading-relaxed " +
                    (m.from === "you"
                      ? "rounded-br-md bg-[color:var(--pp-primary-950)] text-white"
                      : "rounded-bl-md border border-line bg-white text-[color:var(--pp-primary-950)]")
                  }
                >
                  <p>{m.body}</p>
                  <p
                    className={
                      "mt-1.5 text-2xs " + (m.from === "you" ? "text-white/65" : "text-ink-tertiary")
                    }
                  >
                    {m.at}
                  </p>
                </div>
              </div>
            ))}
            <div ref={endRef} />
          </div>

          <form
            className="border-t border-line bg-white p-3 sm:p-4"
            onSubmit={(e) => {
              e.preventDefault();
              send();
            }}
          >
            <div className="flex items-end gap-2 rounded-2xl border border-line bg-[color:var(--pp-primary-100)]/40 p-2 focus-within:border-[color:var(--pp-primary-800)]">
              <label className="sr-only" htmlFor="message-compose">
                Write a message
              </label>
              <textarea
                id="message-compose"
                rows={1}
                value={compose}
                onChange={(e) => setCompose(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    send();
                  }
                }}
                placeholder={`Message ${active.who.split(" ")[0]}…`}
                className="max-h-28 min-h-[2.5rem] flex-1 resize-none bg-transparent px-2 py-2 text-sm text-ink placeholder:text-ink-tertiary focus:outline-none"
              />
              <Button type="submit" size="sm" disabled={!compose.trim()}>
                Send
              </Button>
            </div>
            <p className="mt-2 px-1 text-2xs text-ink-tertiary">
              Not for emergencies. If you need urgent care, call 911 or visit a clinic.
            </p>
          </form>
        </section>
      </div>
    </div>
  );
}
