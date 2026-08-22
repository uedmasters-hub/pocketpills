import { useEffect, useState, type ReactNode } from "react";
import { Link, Navigate, useOutletContext, useParams, useSearchParams } from "react-router-dom";
import { fetchDesignPage, type DesignPage, type DesignVersion } from "@/lib/designSystemApi";
import { DesignPagePreview } from "@/pages/design/DesignPreviews";

function renderMarkdown(md: string) {
  const lines = md.split("\n");
  const nodes: ReactNode[] = [];
  let i = 0;
  let key = 0;
  while (i < lines.length) {
    const line = lines[i];
    if (line.startsWith("## ")) {
      nodes.push(
        <h2 key={key++} className="mt-8 font-display text-xl font-medium text-[color:var(--pp-primary-950)]">
          {line.slice(3)}
        </h2>,
      );
      i += 1;
      continue;
    }
    if (line.startsWith("### ")) {
      nodes.push(
        <h3 key={key++} className="mt-6 text-base font-semibold text-[color:var(--pp-primary-950)]">
          {line.slice(4)}
        </h3>,
      );
      i += 1;
      continue;
    }
    if (line.startsWith("| ")) {
      const rows: string[][] = [];
      while (i < lines.length && lines[i].startsWith("|")) {
        const cells = lines[i]
          .split("|")
          .slice(1, -1)
          .map((c) => c.trim());
        if (!cells.every((c) => /^[-:]+$/.test(c))) rows.push(cells);
        i += 1;
      }
      if (rows.length) {
        const [head, ...body] = rows;
        nodes.push(
          <div key={key++} className="mt-4 overflow-x-auto rounded-xl border border-line bg-white">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-line bg-[color:var(--pp-primary-200)]/60">
                <tr>
                  {head.map((c) => (
                    <th key={c} className="px-3 py-2 font-semibold">
                      {inline(c)}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {body.map((row, ri) => (
                  <tr key={ri} className="border-b border-line last:border-0">
                    {row.map((c, ci) => (
                      <td key={ci} className="px-3 py-2 align-top text-ink-secondary">
                        {inline(c)}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>,
        );
      }
      continue;
    }
    if (line.startsWith("- ")) {
      const items: string[] = [];
      while (i < lines.length && lines[i].startsWith("- ")) {
        items.push(lines[i].slice(2));
        i += 1;
      }
      nodes.push(
        <ul key={key++} className="mt-3 list-disc space-y-1 pl-5 text-sm text-ink-secondary">
          {items.map((item) => (
            <li key={item}>{inline(item)}</li>
          ))}
        </ul>,
      );
      continue;
    }
    if (!line.trim()) {
      i += 1;
      continue;
    }
    nodes.push(
      <p key={key++} className="mt-3 text-sm leading-relaxed text-ink-secondary">
        {inline(line)}
      </p>,
    );
    i += 1;
  }
  return nodes;
}

function inline(text: string): ReactNode {
  const parts = text.split(/(`[^`]+`|\*\*[^*]+\*\*)/g);
  return parts.map((part, i) => {
    if (part.startsWith("`") && part.endsWith("`")) {
      return (
        <code key={i} className="rounded bg-[color:var(--pp-primary-200)] px-1 py-0.5 text-2xs font-medium">
          {part.slice(1, -1)}
        </code>
      );
    }
    if (part.startsWith("**") && part.endsWith("**")) {
      return (
        <strong key={i} className="font-semibold text-[color:var(--pp-primary-950)]">
          {part.slice(2, -2)}
        </strong>
      );
    }
    return <span key={i}>{part}</span>;
  });
}

export function DesignDocPage() {
  const { section = "getting-started", slug = "overview" } = useParams();
  const [params] = useSearchParams();
  const { version } = useOutletContext<{ version?: DesignVersion }>();
  const versionId = params.get("v") || version?.id || "";
  const [page, setPage] = useState<DesignPage | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!versionId) return;
    setError("");
    void fetchDesignPage(versionId, section, slug)
      .then((r) => setPage(r.page))
      .catch((e: Error) => {
        setPage(null);
        setError(e.message || "Page not found");
      });
  }, [versionId, section, slug]);

  if (!versionId) {
    return <p className="text-sm text-ink-tertiary">Loading versions…</p>;
  }

  if (error) {
    return (
      <div className="rounded-2xl border border-line bg-white p-6">
        <p className="text-sm text-ink-secondary">{error}</p>
        <Link to="/design/getting-started/overview" className="mt-3 inline-block text-sm font-medium">
          Back to overview
        </Link>
      </div>
    );
  }

  if (!page) return <p className="text-sm text-ink-tertiary">Loading…</p>;

  return (
    <article className="rounded-2xl border border-line bg-white px-5 py-6 sm:px-8 sm:py-8">
      <div className="flex flex-wrap items-center gap-2">
        <p className="text-2xs font-semibold uppercase tracking-wide text-ink-tertiary">
          {section.replace(/-/g, " ")}
        </p>
        {version ? (
          <span
            className={
              "rounded-full px-2.5 py-0.5 text-2xs font-semibold " +
              (version.isLive
                ? "bg-[color:var(--pp-primary-300)] text-[color:var(--pp-primary-950)]"
                : "bg-[color:var(--neutral-100)] text-ink-tertiary")
            }
          >
            {version.label}
            {version.isLive ? " · Live" : version.status === "draft" ? " · Draft" : ""}
          </span>
        ) : null}
      </div>
      <h1 className="mt-2 font-display text-3xl font-medium text-[color:var(--pp-primary-950)]">{page.title}</h1>
      {page.lede ? <p className="mt-3 max-w-2xl text-base text-ink-secondary">{page.lede}</p> : null}
      <DesignPagePreview section={section} slug={slug} tokens={version?.tokens} />
      <div className="mt-2">{renderMarkdown(page.bodyMd)}</div>
    </article>
  );
}

export function DesignHomeRedirect() {
  return <Navigate to="/design/getting-started/overview" replace />;
}
