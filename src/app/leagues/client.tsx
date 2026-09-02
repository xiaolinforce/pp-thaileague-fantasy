"use client";

import {
  ArrowLeft,
  Check,
  ChevronLeft,
  ChevronRight,
  Clipboard,
  DoorOpen,
  KeyRound,
  LoaderCircle,
  Plus,
  RefreshCw,
  Settings2,
  ShieldCheck,
  Trash2,
  Trophy,
  UserMinus,
  UsersRound,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useRef, useState, type FormEvent, type ReactNode } from "react";

import type { getLeagueDetail, getLeagueOverview } from "@/data/leagues";
import {
  normalizeLeagueInviteCode,
  validatePrivateLeagueName,
} from "@/lib/fantasy/leagues";
import { Localized, useLanguage } from "@/components/fantasy/i18n";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { toast } from "@/components/ui/sonner";
import {
  createPrivateLeagueAction,
  deletePrivateLeagueAction,
  getLeagueDetailAction,
  joinPrivateLeagueAction,
  leavePrivateLeagueAction,
  previewPrivateLeagueInviteAction,
  regeneratePrivateLeagueInviteAction,
  removePrivateLeagueMemberAction,
  renamePrivateLeagueAction,
  type LeagueInvitePreviewResult,
} from "./actions";

type LeagueOverviewState = Awaited<ReturnType<typeof getLeagueOverview>>;
type LeagueDetailState = NonNullable<
  Awaited<ReturnType<typeof getLeagueDetail>>
>;
type SelectedLeague = {
  id: string;
  isOverallHint: boolean;
  league: LeagueDetailState | null;
  loading: boolean;
  error: string;
};

function PendingIcon() {
  return <LoaderCircle className="spin" size={16} aria-hidden="true" />;
}

function FormMessage({
  id,
  message,
  error,
  messageRef,
}: {
  id?: string;
  message: string;
  error?: boolean;
  messageRef?: React.RefObject<HTMLParagraphElement | null>;
}) {
  if (!message) return null;
  return (
    <p
      id={id}
      ref={messageRef}
      className={error ? "league-form-message error" : "league-form-message"}
      role={error ? "alert" : "status"}
      tabIndex={error ? -1 : undefined}
    >
      {message}
    </p>
  );
}

function CreateLeagueDialog({
  open,
  onOpenChange,
  onLeagueCreated,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onLeagueCreated: (leagueId: string) => void;
}) {
  const router = useRouter();
  const { translate } = useLanguage();
  const [name, setName] = useState("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  const errorRef = useRef<HTMLParagraphElement>(null);

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (pending) return;
    const validation = validatePrivateLeagueName(name);
    if (!validation.ok) {
      setError(translate(validation.message));
      window.requestAnimationFrame(() => errorRef.current?.focus());
      return;
    }
    setPending(true);
    setError("");
    const result = await createPrivateLeagueAction({ name });
    setPending(false);
    if (!result.ok) {
      setError(translate(result.message));
      window.requestAnimationFrame(() => errorRef.current?.focus());
      return;
    }
    toast.success(translate(result.message));
    onOpenChange(false);
    setName("");
    if (result.leagueId) onLeagueCreated(result.leagueId);
    router.refresh();
  };

  return (
    <Localized>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent
          className="product-dialog league-dialog"
          closeLabel={translate("ปิด")}
        >
          <form onSubmit={submit}>
            <DialogHeader>
              <DialogTitle>สร้างลีกส่วนตัว</DialogTitle>
            </DialogHeader>
            <label className="league-field">
              <span>ชื่อลีก</span>
              <input
                value={name}
                onChange={(event) => {
                  setName(event.target.value);
                  setError("");
                }}
                autoComplete="off"
                disabled={pending}
                aria-invalid={Boolean(error)}
                aria-describedby={error ? "create-league-error" : undefined}
              />
              <FormMessage
                id="create-league-error"
                message={error}
                error
                messageRef={errorRef}
              />
            </label>
            <DialogFooter className="league-dialog-footer">
              <button
                type="button"
                className="secondary-button"
                onClick={() => onOpenChange(false)}
                disabled={pending}
              >
                ยกเลิก
              </button>
              <button
                type="submit"
                className="primary-button"
                disabled={pending}
                aria-busy={pending}
              >
                {pending ? <PendingIcon /> : <Plus aria-hidden="true" />}
                {pending ? "กำลังสร้างลีก…" : "สร้างลีก"}
              </button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </Localized>
  );
}

function JoinLeagueDialog({
  open,
  onOpenChange,
  initialCode,
  onLeagueOpened,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialCode: string;
  onLeagueOpened: (leagueId: string) => void;
}) {
  const router = useRouter();
  const { translate } = useLanguage();
  const [code, setCode] = useState(
    normalizeLeagueInviteCode(initialCode).slice(0, 8),
  );
  const [preview, setPreview] = useState<
    Extract<LeagueInvitePreviewResult, { ok: true }> | undefined
  >();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  const errorRef = useRef<HTMLParagraphElement>(null);

  const inspect = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (pending) return;
    setPending(true);
    setError("");
    setPreview(undefined);
    const result = await previewPrivateLeagueInviteAction({
      inviteCode: code,
    });
    setPending(false);
    if (!result.ok) {
      setError(translate(result.message));
      window.requestAnimationFrame(() => errorRef.current?.focus());
      return;
    }
    setPreview(result);
  };

  const join = async () => {
    if (!preview || pending) return;
    setPending(true);
    setError("");
    const result = await joinPrivateLeagueAction({
      inviteCode: preview.inviteCode,
    });
    setPending(false);
    if (!result.ok) {
      setError(translate(result.message));
      window.requestAnimationFrame(() => errorRef.current?.focus());
      return;
    }
    toast.success(translate(result.message));
    onOpenChange(false);
    if (result.leagueId) onLeagueOpened(result.leagueId);
    router.refresh();
  };

  return (
    <Localized>
      <Dialog
        open={open}
        onOpenChange={(next) => {
          onOpenChange(next);
          if (!next) {
            setPreview(undefined);
            setError("");
          }
        }}
      >
        <DialogContent
          className="product-dialog league-dialog"
          closeLabel={translate("ปิด")}
        >
          <form onSubmit={inspect}>
            <DialogHeader>
              <DialogTitle>เข้าร่วมลีกส่วนตัว</DialogTitle>
            </DialogHeader>
            <label className="league-field">
              <span>รหัสเชิญ 8 ตัว</span>
              <input
                className="league-code-input"
                value={code}
                onChange={(event) => {
                  setCode(
                    normalizeLeagueInviteCode(event.target.value).slice(0, 8),
                  );
                  setPreview(undefined);
                  setError("");
                }}
                minLength={8}
                maxLength={8}
                autoCapitalize="characters"
                autoComplete="off"
                spellCheck={false}
                required
                disabled={pending}
                aria-invalid={Boolean(error)}
                aria-describedby={error ? "join-league-error" : undefined}
              />
              <FormMessage
                id="join-league-error"
                message={error}
                error
                messageRef={errorRef}
              />
            </label>
            {preview ? (
              <section className="league-invite-preview" aria-live="polite">
                <span aria-hidden="true">
                  <ShieldCheck />
                </span>
                <div>
                  <h3 data-localize="off">{preview.league.name}</h3>
                  <p>{preview.league.memberCount} / 100 สมาชิก</p>
                  {preview.league.alreadyMember ? (
                    <strong>ทีมของคุณอยู่ในลีกนี้แล้ว</strong>
                  ) : preview.league.full ? (
                    <strong>ลีกนี้มีสมาชิกครบแล้ว</strong>
                  ) : (
                    <strong>พร้อมเข้าร่วมด้วยทีมปัจจุบัน</strong>
                  )}
                </div>
              </section>
            ) : null}
            <DialogFooter className="league-dialog-footer">
              <button
                type="button"
                className="secondary-button"
                onClick={() => onOpenChange(false)}
                disabled={pending}
              >
                ยกเลิก
              </button>
              {preview &&
              !preview.league.alreadyMember &&
              !preview.league.full ? (
                <button
                  type="button"
                  className="primary-button"
                  onClick={join}
                  disabled={pending}
                  aria-busy={pending}
                >
                  {pending ? <PendingIcon /> : <Check aria-hidden="true" />}
                  {pending ? "กำลังเข้าร่วม…" : "ยืนยันเข้าร่วม"}
                </button>
              ) : preview?.league.alreadyMember ? (
                <button
                  type="button"
                  className="primary-button"
                  onClick={() => {
                    onOpenChange(false);
                    onLeagueOpened(preview.league.id);
                  }}
                >
                  เปิดลีกนี้
                </button>
              ) : (
                <button
                  type="submit"
                  className="primary-button"
                  disabled={pending || code.length !== 8}
                  aria-busy={pending}
                >
                  {pending ? <PendingIcon /> : <KeyRound aria-hidden="true" />}
                  {pending ? "กำลังตรวจสอบ…" : "ตรวจสอบรหัส"}
                </button>
              )}
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </Localized>
  );
}

function LeagueStandingsDialog({
  leagueId,
  isOverallHint,
  league,
  loading,
  error,
  onOpenChange,
  onPageChange,
}: {
  leagueId: string | null;
  isOverallHint: boolean;
  league: LeagueDetailState | null;
  loading: boolean;
  error: string;
  onOpenChange: (open: boolean) => void;
  onPageChange: (page: number) => void;
}) {
  const { language, translate } = useLanguage();

  const pageLabel =
    language === "th"
      ? `หน้า ${league?.pagination.page ?? 1} / ${league?.pagination.pageCount ?? 1}`
      : `Page ${league?.pagination.page ?? 1} / ${league?.pagination.pageCount ?? 1}`;

  return (
    <Localized>
      <Dialog open={Boolean(leagueId)} onOpenChange={onOpenChange}>
        <DialogContent
          className="product-dialog league-standings-dialog"
          closeLabel={translate("ปิด")}
        >
          <DialogHeader>
            <DialogTitle>
              {isOverallHint ? (
                "100 อันดับแรก"
              ) : league ? (
                <span data-localize="off">{league.name}</span>
              ) : (
                "ตารางอันดับ"
              )}
            </DialogTitle>
          </DialogHeader>

          {loading ? (
            <div className="league-dialog-state" role="status">
              <PendingIcon />
              <span>กำลังโหลดตารางอันดับ…</span>
            </div>
          ) : error ? (
            <div className="league-dialog-state error" role="alert">
              <span>{error}</span>
              <button
                type="button"
                className="secondary-button"
                onClick={() => onPageChange(1)}
              >
                ลองอีกครั้ง
              </button>
            </div>
          ) : league ? (
            <>
              {league.standings.length > 0 ? (
                <div className="league-table-scroll" tabIndex={0}>
                  <table className="league-standings-table">
                    <thead>
                      <tr>
                        <th scope="col">อันดับ</th>
                        <th scope="col">ทีม</th>
                        {!isOverallHint ? <th scope="col">GW</th> : null}
                        <th scope="col">รวม</th>
                        {!isOverallHint ? <th scope="col">Transfer</th> : null}
                      </tr>
                    </thead>
                    <tbody>
                      {league.standings.map((standing) => (
                        <tr
                          className={standing.mine ? "mine" : undefined}
                          key={standing.teamId}
                        >
                          <td className="league-rank-cell">{standing.rank}</td>
                          <th scope="row">
                            <span className="league-team-name">
                              <span data-localize="off">
                                {standing.teamName}
                              </span>
                              {standing.mine ? <i>คุณ</i> : null}
                              {standing.owner ? (
                                <i className="owner">เจ้าของ</i>
                              ) : null}
                            </span>
                          </th>
                          {!isOverallHint ? (
                            <td>{standing.gameweekPoints.toLocaleString()}</td>
                          ) : null}
                          <td className="league-total-cell">
                            {standing.totalPoints.toLocaleString()}
                          </td>
                          {!isOverallHint ? (
                            <td>{standing.transferCount.toLocaleString()}</td>
                          ) : null}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="league-dialog-state" role="status">
                  <span>ยังไม่มีอันดับที่อัปเดต</span>
                </div>
              )}
              {!isOverallHint && league.pagination.pageCount > 1 ? (
                <nav
                  className="league-dialog-pagination"
                  aria-label={translate("หน้าตารางอันดับ")}
                >
                  <button
                    type="button"
                    className="secondary-button"
                    disabled={league.pagination.page === 1 || loading}
                    onClick={() => onPageChange(league.pagination.page - 1)}
                  >
                    <ChevronLeft aria-hidden="true" /> ก่อนหน้า
                  </button>
                  <strong>{pageLabel}</strong>
                  <button
                    type="button"
                    className="secondary-button"
                    disabled={
                      league.pagination.page === league.pagination.pageCount ||
                      loading
                    }
                    onClick={() => onPageChange(league.pagination.page + 1)}
                  >
                    ถัดไป <ChevronRight aria-hidden="true" />
                  </button>
                </nav>
              ) : null}
            </>
          ) : null}
        </DialogContent>
      </Dialog>
    </Localized>
  );
}

export function LeagueOverview({
  overview,
  initialJoinCode,
}: {
  overview: LeagueOverviewState;
  initialJoinCode: string;
}) {
  const { translate } = useLanguage();
  const [createOpen, setCreateOpen] = useState(false);
  const [joinOpen, setJoinOpen] = useState(
    Boolean(initialJoinCode) && !overview.isGuest,
  );
  const [selectedLeague, setSelectedLeague] = useState<SelectedLeague | null>(
    null,
  );

  const openLeague = async (
    leagueId: string,
    isOverallHint: boolean,
    page = 1,
  ) => {
    setSelectedLeague({
      id: leagueId,
      isOverallHint,
      league: null,
      loading: true,
      error: "",
    });
    try {
      const result = await getLeagueDetailAction({ leagueId, page });
      if (!result.ok) {
        setSelectedLeague({
          id: leagueId,
          isOverallHint,
          league: null,
          loading: false,
          error: translate(result.message),
        });
        return;
      }
      setSelectedLeague({
        id: leagueId,
        isOverallHint,
        league: result.league,
        loading: false,
        error: "",
      });
    } catch {
      setSelectedLeague({
        id: leagueId,
        isOverallHint,
        league: null,
        loading: false,
        error: translate("โหลดตารางอันดับไม่สำเร็จ กรุณาลองอีกครั้ง"),
      });
    }
  };

  return (
    <Localized>
      <>
        {overview.overall ? (
          <button
            type="button"
            className="league-overall-surface"
            onClick={() => {
              if (overview.overall) void openLeague(overview.overall.id, true);
            }}
          >
            <span className="league-overall-mark" aria-hidden="true">
              <Trophy />
            </span>
            <div className="league-overall-copy">
              <span>อันดับทั้งหมด</span>
              <strong
                className={
                  overview.overall.rank === null ? "waiting" : undefined
                }
              >
                {overview.overall.rank?.toLocaleString() ?? "รออัปเดตอันดับ"}
              </strong>
            </div>
            <span className="league-open-caret" aria-hidden="true">
              <ChevronRight />
            </span>
          </button>
        ) : (
          <section className="league-system-state" role="alert">
            <Trophy aria-hidden="true" />
            <div>
              <h3>ยังไม่พบ Overall League</h3>
              <p>กรุณาติดต่อผู้ดูแลก่อนเริ่มแข่งขันในฤดูกาลนี้</p>
            </div>
          </section>
        )}

        <section
          className="league-private-section"
          aria-labelledby="private-heading"
        >
          <div className="league-section-heading">
            <h2 id="private-heading">ลีกส่วนตัว</h2>
            {!overview.isGuest ? (
              <div className="league-heading-actions">
                <button
                  type="button"
                  className="secondary-button"
                  onClick={() => setJoinOpen(true)}
                >
                  <KeyRound aria-hidden="true" /> เข้าร่วมลีก
                </button>
                <button
                  type="button"
                  className="primary-button"
                  onClick={() => setCreateOpen(true)}
                  disabled={
                    overview.limits.owned >= overview.limits.ownerLimit ||
                    overview.limits.memberships >=
                      overview.limits.membershipLimit
                  }
                >
                  <Plus aria-hidden="true" /> สร้างลีก
                </button>
              </div>
            ) : null}
          </div>

          {overview.privateLeagues.length > 0 ? (
            <ul className="league-private-list">
              {overview.privateLeagues.map((league) => (
                <li key={league.id}>
                  <button
                    type="button"
                    onClick={() => void openLeague(league.id, false)}
                  >
                    <span className="league-list-rank">
                      #{league.rank ?? "—"}
                    </span>
                    <span className="league-list-identity">
                      <strong data-localize="off">{league.name}</strong>
                      <small>
                        {league.memberCount} สมาชิก
                        {league.isOwner ? " · คุณเป็นเจ้าของ" : ""}
                      </small>
                    </span>
                    <span className="league-list-points">
                      <small>คะแนนรวม</small>
                      <strong>{league.totalPoints.toLocaleString()}</strong>
                    </span>
                    <ChevronRight aria-hidden="true" />
                  </button>
                </li>
              ))}
            </ul>
          ) : (
            <p className="league-private-empty-copy">
              {overview.isGuest
                ? "ต้องสมัครสมาชิกเพื่อเข้าร่วมลีกเล่นกับเพื่อน"
                : "ยังไม่มีลีกส่วนตัว"}
            </p>
          )}
        </section>

        {!overview.isGuest ? (
          <>
            <CreateLeagueDialog
              open={createOpen}
              onOpenChange={setCreateOpen}
              onLeagueCreated={(leagueId) => void openLeague(leagueId, false)}
            />
            <JoinLeagueDialog
              open={joinOpen}
              onOpenChange={setJoinOpen}
              initialCode={initialJoinCode}
              onLeagueOpened={(leagueId) => void openLeague(leagueId, false)}
            />
          </>
        ) : null}
        <LeagueStandingsDialog
          leagueId={selectedLeague?.id ?? null}
          isOverallHint={selectedLeague?.isOverallHint ?? false}
          league={selectedLeague?.league ?? null}
          loading={selectedLeague?.loading ?? false}
          error={selectedLeague?.error ?? ""}
          onOpenChange={(open) => !open && setSelectedLeague(null)}
          onPageChange={(page) => {
            if (selectedLeague) {
              void openLeague(
                selectedLeague.id,
                selectedLeague.isOverallHint,
                page,
              );
            }
          }}
        />
      </>
    </Localized>
  );
}

type ConfirmAction = {
  title: ReactNode;
  description: ReactNode;
  label: ReactNode;
  run: () => Promise<void>;
};

function ConfirmationDialog({
  action,
  pending,
  onClose,
}: {
  action: ConfirmAction | null;
  pending: boolean;
  onClose: () => void;
}) {
  return (
    <Localized>
      <AlertDialog
        open={Boolean(action)}
        onOpenChange={(open) => !open && onClose()}
      >
        <AlertDialogContent className="product-dialog">
          <AlertDialogHeader>
            <AlertDialogTitle>{action?.title}</AlertDialogTitle>
            <AlertDialogDescription>
              {action?.description}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={pending}>ยกเลิก</AlertDialogCancel>
            <AlertDialogAction
              variant="destructive"
              onClick={action?.run}
              disabled={pending}
              aria-busy={pending}
            >
              {pending ? <PendingIcon /> : null}
              {pending ? "กำลังดำเนินการ…" : action?.label}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Localized>
  );
}

export function LeagueDetail({ league }: { league: LeagueDetailState }) {
  const router = useRouter();
  const { translate } = useLanguage();
  const [name, setName] = useState(league.name);
  const [inviteCode, setInviteCode] = useState(league.inviteCode ?? "");
  const [pendingTask, setPendingTask] = useState("");
  const [formError, setFormError] = useState("");
  const [confirmAction, setConfirmAction] = useState<ConfirmAction | null>(
    null,
  );
  const errorRef = useRef<HTMLParagraphElement>(null);

  const reportFailure = (message: string) => {
    const localized = translate(message);
    setFormError(localized);
    toast.error(localized);
    window.requestAnimationFrame(() => errorRef.current?.focus());
  };

  const rename = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (pendingTask || name.trim() === league.name) return;
    setPendingTask("rename");
    setFormError("");
    const result = await renamePrivateLeagueAction({
      leagueId: league.id,
      name,
    });
    setPendingTask("");
    if (!result.ok) return reportFailure(result.message);
    toast.success(translate(result.message));
    router.refresh();
  };

  const regenerate = async () => {
    if (pendingTask) return;
    setPendingTask("regenerate");
    setFormError("");
    const result = await regeneratePrivateLeagueInviteAction({
      leagueId: league.id,
    });
    setPendingTask("");
    if (!result.ok) return reportFailure(result.message);
    setInviteCode(result.inviteCode ?? "");
    setConfirmAction(null);
    toast.success(translate(result.message));
    router.refresh();
  };

  const copy = async (kind: "code" | "link") => {
    const value =
      kind === "code"
        ? inviteCode
        : `${window.location.origin}/leagues?join=${inviteCode}`;
    try {
      await navigator.clipboard.writeText(value);
      toast.success(
        translate(kind === "code" ? "คัดลอกรหัสแล้ว" : "คัดลอกลิงก์เชิญแล้ว"),
      );
    } catch {
      reportFailure("คัดลอกไม่สำเร็จ กรุณาเลือกรหัสแล้วคัดลอกด้วยตนเอง");
    }
  };

  const runConfirmed = async (
    task: string,
    action: () => ReturnType<
      | typeof leavePrivateLeagueAction
      | typeof deletePrivateLeagueAction
      | typeof removePrivateLeagueMemberAction
    >,
    destination?: string,
  ) => {
    setPendingTask(task);
    setFormError("");
    const result = await action();
    setPendingTask("");
    if (!result.ok) return reportFailure(result.message);
    setConfirmAction(null);
    toast.success(translate(result.message));
    if (destination) router.push(destination);
    router.refresh();
  };

  const pageHref = (page: number) => `/leagues/${league.id}?page=${page}`;

  return (
    <Localized>
      <>
        <Link href="/leagues" className="league-back-link">
          <ArrowLeft aria-hidden="true" /> กลับไปลีกของฉัน
        </Link>

        <header className="league-detail-heading">
          <div>
            <span className="league-type-label">
              {league.type === "overall"
                ? "Overall Classic"
                : "Private Classic"}
            </span>
            <h2 data-localize="off">{league.name}</h2>
            <p>
              {league.memberCount} ผู้จัดการ · Gameweek{" "}
              {String(league.gameweek.number).padStart(2, "0")}
            </p>
          </div>
          <dl className="league-detail-result">
            <div>
              <dt>อันดับของคุณ</dt>
              <dd>#{league.myStanding?.rank ?? "—"}</dd>
            </div>
            <div>
              <dt>คะแนน GW</dt>
              <dd>
                {league.myStanding?.gameweekPoints.toLocaleString() ?? "0"}
              </dd>
            </div>
            <div>
              <dt>คะแนนรวม</dt>
              <dd>{league.myStanding?.totalPoints.toLocaleString() ?? "0"}</dd>
            </div>
          </dl>
        </header>

        <div className="league-detail-layout">
          <section
            className="league-standings-surface"
            aria-labelledby="standings-heading"
          >
            <div className="league-standings-heading">
              <div>
                <h2 id="standings-heading">ตารางอันดับ</h2>
                <p>
                  เรียงจากคะแนนรวม แล้วใช้ Transfer ที่น้อยกว่าเป็นตัวตัดสิน
                </p>
              </div>
              <span>
                {league.gameweek.scoreComplete
                  ? "คะแนน Final"
                  : "คะแนนชั่วคราว"}
              </span>
            </div>
            <div className="league-table-scroll" tabIndex={0}>
              <table
                className={`league-standings-table${
                  league.isOwner && league.type === "private"
                    ? " league-owner-standings"
                    : ""
                }`}
              >
                <thead>
                  <tr>
                    <th scope="col">อันดับ</th>
                    <th scope="col">ทีม</th>
                    <th scope="col">GW</th>
                    <th scope="col">รวม</th>
                    <th scope="col">Transfer</th>
                    {league.isOwner && league.type === "private" ? (
                      <th scope="col">
                        <span className="sr-only">จัดการสมาชิก</span>
                      </th>
                    ) : null}
                  </tr>
                </thead>
                <tbody>
                  {league.standings.map((standing) => (
                    <tr
                      className={standing.mine ? "mine" : undefined}
                      key={standing.teamId}
                    >
                      <td className="league-rank-cell">{standing.rank}</td>
                      <th scope="row">
                        <span className="league-team-name">
                          <span data-localize="off">{standing.teamName}</span>
                          {standing.mine ? <i>คุณ</i> : null}
                          {standing.owner ? (
                            <i className="owner">เจ้าของ</i>
                          ) : null}
                        </span>
                      </th>
                      <td>{standing.gameweekPoints.toLocaleString()}</td>
                      <td className="league-total-cell">
                        {standing.totalPoints.toLocaleString()}
                      </td>
                      <td>{standing.transferCount.toLocaleString()}</td>
                      {league.isOwner && league.type === "private" ? (
                        <td>
                          {!standing.owner ? (
                            <button
                              type="button"
                              className="league-row-action"
                              onClick={() =>
                                setConfirmAction({
                                  title: (
                                    <>
                                      นำ{" "}
                                      <span data-localize="off">
                                        {standing.teamName}
                                      </span>{" "}
                                      ออกจากลีก?
                                    </>
                                  ),
                                  description:
                                    "ทีมนี้จะออกจากตารางอันดับ แต่สามารถใช้รหัสเชิญปัจจุบันเข้าร่วมใหม่ได้",
                                  label: "นำสมาชิกออก",
                                  run: () =>
                                    runConfirmed("remove", () =>
                                      removePrivateLeagueMemberAction({
                                        leagueId: league.id,
                                        targetTeamId: standing.teamId,
                                      }),
                                    ),
                                })
                              }
                              aria-label={`นำ ${standing.teamName} ออกจากลีก`}
                            >
                              <UserMinus aria-hidden="true" /> นำออก
                            </button>
                          ) : null}
                        </td>
                      ) : null}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {league.pagination.pageCount > 1 ? (
              <nav className="league-pagination" aria-label="หน้าตารางอันดับ">
                {league.pagination.page > 1 ? (
                  <Link href={pageHref(league.pagination.page - 1)}>
                    <ChevronLeft aria-hidden="true" /> ก่อนหน้า
                  </Link>
                ) : (
                  <span aria-disabled="true">
                    <ChevronLeft aria-hidden="true" /> ก่อนหน้า
                  </span>
                )}
                <strong>
                  หน้า {league.pagination.page} / {league.pagination.pageCount}
                </strong>
                {league.pagination.page < league.pagination.pageCount ? (
                  <Link href={pageHref(league.pagination.page + 1)}>
                    ถัดไป <ChevronRight aria-hidden="true" />
                  </Link>
                ) : (
                  <span aria-disabled="true">
                    ถัดไป <ChevronRight aria-hidden="true" />
                  </span>
                )}
              </nav>
            ) : null}
            <footer className="league-table-note">
              <span>Wildcard ไม่นับจำนวน Transfer</span>
              <span>
                {league.gameweek.scoreComplete
                  ? "อันดับนี้สรุปแล้ว"
                  : "อันดับอาจเปลี่ยนหลังอัปเดตคะแนน"}
              </span>
            </footer>
          </section>

          <aside
            className="league-management"
            aria-label="ข้อมูลและการจัดการลีก"
          >
            {league.type === "overall" ? (
              <section className="league-management-section">
                <span className="league-management-icon" aria-hidden="true">
                  <Trophy />
                </span>
                <h2>ลีกของผู้เล่นทุกคน</h2>
                <p>
                  ทุกทีมเข้าร่วม Overall อัตโนมัติและไม่สามารถออกจากลีกนี้ได้
                </p>
              </section>
            ) : league.isOwner ? (
              <>
                <section className="league-management-section">
                  <div className="league-management-title">
                    <KeyRound aria-hidden="true" />
                    <h2>เชิญสมาชิก</h2>
                  </div>
                  <p>แชร์รหัสหรือลิงก์นี้กับสมาชิกที่เข้าสู่ระบบแล้ว</p>
                  <output
                    className="league-invite-code"
                    aria-label={`รหัสเชิญ ${inviteCode}`}
                  >
                    {inviteCode}
                  </output>
                  <div className="league-invite-actions">
                    <button
                      type="button"
                      className="secondary-button"
                      onClick={() => copy("code")}
                    >
                      <Clipboard aria-hidden="true" /> คัดลอกรหัส
                    </button>
                    <button
                      type="button"
                      className="secondary-button"
                      onClick={() => copy("link")}
                    >
                      <Clipboard aria-hidden="true" /> คัดลอกลิงก์
                    </button>
                  </div>
                  <button
                    type="button"
                    className="league-text-action"
                    onClick={() =>
                      setConfirmAction({
                        title: "สร้างรหัสเชิญใหม่?",
                        description:
                          "รหัสและลิงก์เดิมจะใช้ไม่ได้ทันที สมาชิกที่อยู่ในลีกแล้วจะไม่ถูกนำออก",
                        label: "สร้างรหัสใหม่",
                        run: regenerate,
                      })
                    }
                    disabled={Boolean(pendingTask)}
                  >
                    <RefreshCw aria-hidden="true" /> สร้างรหัสใหม่
                  </button>
                </section>

                <section className="league-management-section">
                  <div className="league-management-title">
                    <Settings2 aria-hidden="true" />
                    <h2>ตั้งค่าลีก</h2>
                  </div>
                  <form onSubmit={rename}>
                    <label className="league-field compact">
                      <span>ชื่อลีก</span>
                      <input
                        value={name}
                        onChange={(event) => setName(event.target.value)}
                        minLength={3}
                        maxLength={40}
                        disabled={Boolean(pendingTask)}
                        required
                      />
                    </label>
                    <button
                      type="submit"
                      className="secondary-button"
                      disabled={
                        Boolean(pendingTask) || name.trim() === league.name
                      }
                    >
                      {pendingTask === "rename" ? (
                        <PendingIcon />
                      ) : (
                        <Check aria-hidden="true" />
                      )}
                      บันทึกชื่อ
                    </button>
                  </form>
                  <button
                    type="button"
                    className="league-danger-action"
                    onClick={() =>
                      setConfirmAction({
                        title: (
                          <>
                            ลบ <span data-localize="off">{league.name}</span>?
                          </>
                        ),
                        description:
                          "ลีกและสมาชิกภาพจะถูกลบถาวร แต่ทีม คะแนน และประวัติ Fantasy ของทุกคนจะไม่เปลี่ยนแปลง",
                        label: "ลบลีกถาวร",
                        run: () =>
                          runConfirmed(
                            "delete",
                            () =>
                              deletePrivateLeagueAction({
                                leagueId: league.id,
                              }),
                            "/leagues",
                          ),
                      })
                    }
                  >
                    <Trash2 aria-hidden="true" /> ลบลีก
                  </button>
                </section>
              </>
            ) : (
              <section className="league-management-section">
                <span className="league-management-icon" aria-hidden="true">
                  <UsersRound />
                </span>
                <h2>สมาชิก Private League</h2>
                <p>อันดับนี้เห็นได้เฉพาะสมาชิกของลีกเท่านั้น</p>
                <button
                  type="button"
                  className="secondary-button danger-button"
                  onClick={() =>
                    setConfirmAction({
                      title: (
                        <>
                          ออกจาก <span data-localize="off">{league.name}</span>?
                        </>
                      ),
                      description:
                        "ทีมของคุณจะหายจากตารางอันดับลีกนี้ หากต้องการกลับมาต้องใช้รหัสเชิญที่ยังใช้งานได้",
                      label: "ออกจากลีก",
                      run: () =>
                        runConfirmed(
                          "leave",
                          () =>
                            leavePrivateLeagueAction({ leagueId: league.id }),
                          "/leagues",
                        ),
                    })
                  }
                >
                  <DoorOpen aria-hidden="true" /> ออกจากลีก
                </button>
              </section>
            )}
            <FormMessage message={formError} error messageRef={errorRef} />
          </aside>
        </div>

        <ConfirmationDialog
          action={confirmAction}
          pending={Boolean(pendingTask)}
          onClose={() => !pendingTask && setConfirmAction(null)}
        />
      </>
    </Localized>
  );
}
