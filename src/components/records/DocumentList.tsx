import { useState, type ReactNode } from "react";
import { ConfirmModal, Modal } from "@/components/ui";
import { Button } from "@/components/ui/Button";
import { ReportThumb } from "@/components/records/ReportThumb";
import { useI18n } from "@/lib/i18n";
import {
  deletePatientFile,
  downloadPatientFile,
  getPatientFilePreview,
  type PatientFile,
} from "@/lib/patientRecords";

export function DocumentList({
  files,
  patientId,
  empty,
}: {
  files: PatientFile[];
  patientId: string;
  empty: string;
}) {
  const { tx } = useI18n();
  const [view, setView] = useState<PatientFile | null>(null);
  const [remove, setRemove] = useState<PatientFile | null>(null);
  const preview = view ? getPatientFilePreview(view.id) : undefined;
  const isRx = view?.kind === "prescription";

  if (files.length === 0) {
    return <p className="text-sm text-ink-tertiary">{empty}</p>;
  }

  return (
    <>
      <ul className="divide-y divide-line">
        {files.map((file) => {
          const src = getPatientFilePreview(file.id);
          const rx = file.kind === "prescription";
          return (
            <li key={file.id} className="flex items-center gap-3 py-3">
              <button
                type="button"
                onClick={() => setView(file)}
                className="shrink-0 rounded-lg outline-none ring-[color:var(--pp-violet)] focus-visible:ring-2"
                aria-label={rx ? tx("See full prescription") : tx("Preview")}
              >
                <ReportThumb src={src} placeholder className="h-14 w-[4.5rem]" />
              </button>
              <div className="min-w-0 flex-1">
                <p className="flex min-w-0 items-center gap-2">
                  <span className="truncate text-sm font-medium text-[color:var(--pp-primary-950)]">{tx(file.title)}</span>
                  {rx ? (
                    <span className="shrink-0 rounded-full bg-[color:var(--pp-primary-100)] px-2 py-0.5 text-2xs font-semibold text-[color:var(--pp-primary-950)]">
                      {tx("Prescription")}
                    </span>
                  ) : null}
                </p>
                <p className="truncate text-2xs text-ink-tertiary">
                  {tx(file.detail)} · {file.date}
                </p>
              </div>
              <div className="flex shrink-0 items-center gap-0.5">
                <IconBtn
                  label={rx ? tx("See full prescription") : tx("Preview")}
                  onClick={() => setView(file)}
                >
                  <EyeIcon />
                </IconBtn>
                <IconBtn
                  label={tx("Download")}
                  disabled={!src}
                  onClick={() => downloadPatientFile(file)}
                >
                  <DownloadIcon />
                </IconBtn>
                <IconBtn label={tx("Delete")} onClick={() => setRemove(file)}>
                  <TrashIcon />
                </IconBtn>
              </div>
            </li>
          );
        })}
      </ul>

      <Modal
        open={Boolean(view)}
        title={view ? tx(isRx ? "Full prescription" : view.title) : ""}
        onClose={() => setView(null)}
        footer={
          <>
            {preview ? (
              <Button
                size="sm"
                variant="secondary"
                onClick={() => view && downloadPatientFile(view)}
              >
                {tx("Download")}
              </Button>
            ) : null}
            <Button size="sm" onClick={() => setView(null)}>
              {tx("Close")}
            </Button>
          </>
        }
      >
        {view ? (
          <div>
            {preview ? (
              <img
                src={preview}
                alt=""
                className="max-h-[min(36rem,70vh)] w-full rounded-xl border border-line object-contain object-top bg-white"
              />
            ) : (
              <p className="text-sm text-ink-secondary">
                {tx("No photo is stored for this file. The title and date stay on your record.")}
              </p>
            )}
            <p className="mt-3 text-sm text-ink-tertiary">
              {tx(view.detail)} · {view.date}
              {view.fileName ? ` · ${view.fileName}` : ""}
            </p>
          </div>
        ) : null}
      </Modal>

      <ConfirmModal
        open={Boolean(remove)}
        title={tx("Delete this file?")}
        body={tx("It will be removed from this profile. You can upload it again later.")}
        confirmLabel={tx("Delete")}
        cancelLabel={tx("Keep")}
        danger
        onClose={() => setRemove(null)}
        onConfirm={() => {
          if (!remove) return;
          deletePatientFile(patientId, remove.id);
          if (view?.id === remove.id) setView(null);
          setRemove(null);
        }}
      />
    </>
  );
}

function IconBtn({
  label,
  onClick,
  disabled,
  children,
}: {
  label: string;
  onClick: () => void;
  disabled?: boolean;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      disabled={disabled}
      onClick={onClick}
      className="grid h-8 w-8 place-items-center rounded-full text-ink-tertiary hover:bg-[color:var(--state-hover)] hover:text-[color:var(--pp-primary-950)] disabled:opacity-30"
    >
      {children}
    </button>
  );
}

function EyeIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7Z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  );
}

function DownloadIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M12 4v12" />
      <path d="m7 12 5 5 5-5" />
      <path d="M5 20h14" />
    </svg>
  );
}

function TrashIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <polyline points="3 6 5 6 21 6" />
      <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
    </svg>
  );
}
