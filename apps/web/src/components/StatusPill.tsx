const LABEL: Record<string, string> = {
  submitted: "かくにん中",
  approved: "かんりょう",
  rejected: "やりなおし",
};

const CLASS: Record<string, string> = {
  submitted: "pill pillSubmitted",
  approved: "pill pillApproved",
  rejected: "pill pillRejected",
};

export function StatusPill({ status }: { status: string | null }) {
  if (!status) {
    return <span className="pill pillNeutral">みてない</span>;
  }
  return <span className={CLASS[status] ?? "pill pillNeutral"}>{LABEL[status] ?? status}</span>;
}
