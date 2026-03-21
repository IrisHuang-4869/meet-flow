"use client";

import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import {
  Plus,
  Users,
  Calendar,
  User,
  CalendarCheck,
  Link as LinkIcon,
  ClipboardCopy,
  Check,
  Trophy,
} from "lucide-react";

// ─── Types ────────────────────────────────────────────────────────────────────

type TimeSlot = string; // "day-hour", e.g. "0-9" = Monday 9am

type Member = {
  id: string;
  name: string;
  color: string;
  ratings: Record<TimeSlot, number>; // 0-5
  submitted: boolean;
};

// ─── Constants ────────────────────────────────────────────────────────────────

const DAYS = ["週一", "週二", "週三", "週四", "週五"];
const HOURS = [9, 10, 11, 12, 13, 14, 15, 16, 17];
const COLORS = [
  "bg-orange-500",
  "bg-pink-500",
  "bg-teal-500",
  "bg-indigo-500",
  "bg-red-500",
  "bg-yellow-500",
  "bg-cyan-500",
];

const slot = (day: number, hour: number): TimeSlot => `${day}-${hour}`;
const toLabel = (s: TimeSlot) => {
  const [d, h] = s.split("-").map(Number);
  return `${DAYS[d]} ${h}:00-${h + 1}:00`;
};

// ─── Fake initial data ────────────────────────────────────────────────────────

// 假資料：先預設候選時段與分數，方便展示
const INITIAL_MEMBERS: Member[] = [
  {
    id: "me",
    name: "我",
    color: "bg-blue-500",
    ratings: {},
    submitted: false,
  },
  {
    id: "xiao-liang",
    name: "小梁",
    color: "bg-green-500",
    ratings: {
      [slot(0, 10)]: 4,
      [slot(0, 11)]: 5,
      [slot(2, 10)]: 3,
      [slot(3, 14)]: 4,
    },
    submitted: true,
  },
  {
    id: "lu-lu",
    name: "盧盧",
    color: "bg-purple-500",
    ratings: {
      [slot(0, 10)]: 2,
      [slot(0, 11)]: 4,
      [slot(2, 10)]: 5,
      [slot(3, 14)]: 3,
    },
    submitted: true,
  },
];

// ─── Schedule Grid Component ──────────────────────────────────────────────────

type DragState = {
  startDay: number;
  startHourIdx: number;
  curDay: number;
  curHourIdx: number;
  filling: boolean; // true = turning slots ON, false = turning OFF
};

function ScheduleGrid({
  activeSlots,
  onBatchToggle,
  emerald = false,
}: {
  activeSlots: TimeSlot[];
  onBatchToggle?: (slots: TimeSlot[], fill: boolean) => void;
  emerald?: boolean;
}) {
  const [drag, setDrag] = useState<DragState | null>(null);
  const dragging = useRef(false);

  // Commit the selection when mouse is released anywhere
  useEffect(() => {
    function handleMouseUp() {
      if (!dragging.current || !drag) return;
      const d0 = Math.min(drag.startDay, drag.curDay);
      const d1 = Math.max(drag.startDay, drag.curDay);
      const h0 = Math.min(drag.startHourIdx, drag.curHourIdx);
      const h1 = Math.max(drag.startHourIdx, drag.curHourIdx);
      const selected: TimeSlot[] = [];
      for (let d = d0; d <= d1; d++)
        for (let hi = h0; hi <= h1; hi++)
          selected.push(slot(d, HOURS[hi]));
      onBatchToggle?.(selected, drag.filling);
      dragging.current = false;
      setDrag(null);
    }
    document.addEventListener("mouseup", handleMouseUp);
    return () => document.removeEventListener("mouseup", handleMouseUp);
  }, [drag, onBatchToggle]);

  function inDragRect(d: number, hi: number): boolean {
    if (!drag) return false;
    const d0 = Math.min(drag.startDay, drag.curDay);
    const d1 = Math.max(drag.startDay, drag.curDay);
    const h0 = Math.min(drag.startHourIdx, drag.curHourIdx);
    const h1 = Math.max(drag.startHourIdx, drag.curHourIdx);
    return d >= d0 && d <= d1 && hi >= h0 && hi <= h1;
  }

  return (
    <div className="overflow-x-auto select-none">
      <table className="w-full text-sm border-collapse">
        <thead>
          <tr>
            <th className="w-14" />
            {DAYS.map((d) => (
              <th key={d} className="p-2 text-center font-medium text-sm">
                {d}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {HOURS.map((h, hi) => (
            <tr key={h}>
              <td className="text-right pr-3 text-muted-foreground text-xs py-0.5 whitespace-nowrap">
                {h}:00
              </td>
              {DAYS.map((_, d) => {
                const s = slot(d, h);
                const active = activeSlots.includes(s);
                const inRect = inDragRect(d, hi);

                let cellClass: string;
                if (inRect) {
                  // Preview: show what the result will be
                  cellClass = drag!.filling
                    ? "bg-primary/60 border-primary/60"
                    : "bg-muted border-border opacity-40";
                } else if (active) {
                  cellClass = emerald
                    ? "bg-emerald-400 border-emerald-400"
                    : "bg-primary border-primary";
                } else {
                  cellClass = "bg-muted border-border hover:bg-muted/60";
                }

                return (
                  <td key={d} className="p-0.5">
                    <div
                      className={`h-8 rounded border transition-colors ${cellClass} ${onBatchToggle ? "cursor-pointer" : "cursor-default"}`}
                      onMouseDown={(e) => {
                        if (!onBatchToggle) return;
                        e.preventDefault();
                        dragging.current = true;
                        setDrag({
                          startDay: d,
                          startHourIdx: hi,
                          curDay: d,
                          curHourIdx: hi,
                          filling: !active,
                        });
                      }}
                      onMouseOver={() => {
                        if (!dragging.current) return;
                        setDrag((prev) =>
                          prev ? { ...prev, curDay: d, curHourIdx: hi } : prev
                        );
                      }}
                    />
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function ScoreHeatmapGrid({
  candidateSlots,
  totals,
  bestSlot,
}: {
  candidateSlots: TimeSlot[];
  totals: Record<TimeSlot, number>;
  bestSlot?: TimeSlot;
}) {
  const maxScore = Math.max(1, ...Object.values(totals), 1);
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm border-collapse">
        <thead>
          <tr>
            <th className="w-14" />
            {DAYS.map((d) => (
              <th key={d} className="p-2 text-center font-medium text-sm">
                {d}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {HOURS.map((h) => (
            <tr key={h}>
              <td className="text-right pr-3 text-muted-foreground text-xs py-0.5 whitespace-nowrap">
                {h}:00
              </td>
              {DAYS.map((_, d) => {
                const s = slot(d, h);
                const isCandidate = candidateSlots.includes(s);
                const score = totals[s] ?? 0;
                const intensity = isCandidate ? score / maxScore : 0;
                const isBest = bestSlot === s && score > 0;
                return (
                  <td key={d} className="p-0.5">
                    <div
                      className="h-8 rounded border flex items-center justify-center text-[11px] font-medium"
                      style={{
                        backgroundColor: isCandidate
                          ? `rgba(16, 185, 129, ${0.08 + intensity * 0.82})`
                          : "hsl(var(--muted))",
                        borderColor: isBest
                          ? "rgb(234 179 8)"
                          : "hsl(var(--border))",
                        color: isCandidate
                          ? intensity > 0.58
                            ? "white"
                            : "hsl(var(--foreground))"
                          : "hsl(var(--muted-foreground))",
                        borderWidth: isBest ? "2px" : "1px",
                      }}
                      title={
                        isCandidate
                          ? `${toLabel(s)}：總分 ${score}`
                          : "非候選時段"
                      }
                    >
                      {isCandidate ? score : "-"}
                    </div>
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ─── Legend ───────────────────────────────────────────────────────────────────

function Legend({ items }: { items: { color: string; label: string }[] }) {
  return (
    <div className="flex gap-4 mb-5 text-xs text-muted-foreground">
      {items.map((item) => (
        <div key={item.label} className="flex items-center gap-1.5">
          <div className={`w-3 h-3 rounded ${item.color}`} />
          {item.label}
        </div>
      ))}
    </div>
  );
}

// ─── Main App ─────────────────────────────────────────────────────────────────

export default function MeetFlow() {
  const [members, setMembers] = useState<Member[]>(INITIAL_MEMBERS);
  const [newName, setNewName] = useState("");
  const [open, setOpen] = useState(false);
  const [viewId, setViewId] = useState("xiao-liang");
  const [candidateSlots, setCandidateSlots] = useState<TimeSlot[]>([
    slot(0, 10),
    slot(0, 11),
    slot(2, 10),
    slot(3, 14),
  ]);
  const [meetingId] = useState(`mf-${Date.now().toString(36)}`);
  const [copied, setCopied] = useState(false);

  const me = members.find((m) => m.id === "me")!;
  const others = members.filter((m) => m.id !== "me");
  const viewing = members.find((m) => m.id === viewId) ?? others[0];

  const inviteLink =
    typeof window === "undefined"
      ? `https://meet-flow.app/invite/${meetingId}`
      : `${window.location.origin}?invite=${meetingId}`;

  useEffect(() => {
    setMembers((prev) =>
      prev.map((m) => ({
        ...m,
        ratings: Object.fromEntries(
          candidateSlots.map((s) => [s, m.ratings[s] ?? 0])
        ) as Record<TimeSlot, number>,
      }))
    );
  }, [candidateSlots]);

  const allSubmitted = members.every((m) => m.submitted);

  const slotTotals = candidateSlots.reduce<Record<TimeSlot, number>>(
    (acc, s) => {
      acc[s] = members.reduce((sum, m) => sum + (m.ratings[s] ?? 0), 0);
      return acc;
    },
    {}
  );

  const bestSlot = Object.entries(slotTotals).sort((a, b) => b[1] - a[1])[0]?.[0];
  const bestScore = bestSlot ? slotTotals[bestSlot] : 0;

  function batchToggleCandidateSlots(slots: TimeSlot[], fill: boolean) {
    setCandidateSlots((prev) => {
      const next = fill
        ? [...new Set([...prev, ...slots])]
        : prev.filter((x) => !slots.includes(x));
      return next.sort();
    });
  }

  function setMyRating(targetSlot: TimeSlot, score: number) {
    setMembers((prev) =>
      prev.map((m) =>
        m.id !== "me"
          ? m
          : {
              ...m,
              submitted: false,
              ratings: {
                ...m.ratings,
                [targetSlot]: score,
              },
            }
      )
    );
  }

  function submitMyRatings() {
    setMembers((prev) =>
      prev.map((m) => (m.id === "me" ? { ...m, submitted: true } : m))
    );
  }

  async function copyInviteLink() {
    try {
      await navigator.clipboard.writeText(inviteLink);
      setCopied(true);
      setTimeout(() => setCopied(false), 1200);
    } catch {
      setCopied(false);
    }
  }

  function addMember() {
    const name = newName.trim();
    if (!name) return;
    const color = COLORS[members.length % COLORS.length];
    const newMember: Member = {
      id: `member-${Date.now()}`,
      name,
      color,
      ratings: Object.fromEntries(
        candidateSlots.map((s) => [s, 0])
      ) as Record<TimeSlot, number>,
      submitted: false,
    };
    setMembers((prev) => [...prev, newMember]);
    setNewName("");
    setOpen(false);
  }

  return (
    <div className="min-h-screen bg-background">
      {/* ── Header ── */}
      <header className="border-b bg-background/80 backdrop-blur sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-6 py-4 flex items-center gap-3">
          <CalendarCheck className="w-5 h-5" />
          <h1 className="text-lg font-semibold tracking-tight">MeetFlow</h1>
          <Badge variant="secondary" className="text-xs font-normal">
            Beta
          </Badge>
        </div>
      </header>

      {/* ── Main ── */}
      <main className="max-w-4xl mx-auto px-6 py-8">
        <Tabs defaultValue="members">
          <TabsList className="mb-8 h-10">
            <TabsTrigger value="invite" className="gap-1.5 text-sm">
              <LinkIcon className="w-3.5 h-3.5" />
              邀請
            </TabsTrigger>
            <TabsTrigger value="members" className="gap-1.5 text-sm">
              <Users className="w-3.5 h-3.5" />
              成員
            </TabsTrigger>
            <TabsTrigger value="my-schedule" className="gap-1.5 text-sm">
              <User className="w-3.5 h-3.5" />
              我的時間表
            </TabsTrigger>
            <TabsTrigger value="view-member" className="gap-1.5 text-sm">
              <Calendar className="w-3.5 h-3.5" />
              查看成員
            </TabsTrigger>
            <TabsTrigger value="common" className="gap-1.5 text-sm">
              <CalendarCheck className="w-3.5 h-3.5" />
              共同空閒
            </TabsTrigger>
          </TabsList>

          {/* ── Tab 0: Invite ── */}
          <TabsContent value="invite">
            <div className="mb-5">
              <h2 className="text-base font-semibold">會議邀請連結</h2>
              <p className="text-sm text-muted-foreground mt-0.5">
                分享連結給成員，成員可在候選時段對每格評分（0-5）
              </p>
            </div>
            <Card>
              <CardContent className="pt-6 space-y-4">
                <div className="flex gap-2">
                  <Input value={inviteLink} readOnly />
                  <Button
                    type="button"
                    variant="outline"
                    className="gap-1.5 shrink-0"
                    onClick={copyInviteLink}
                  >
                    {copied ? (
                      <>
                        <Check className="w-4 h-4" />
                        已複製
                      </>
                    ) : (
                      <>
                        <ClipboardCopy className="w-4 h-4" />
                        複製
                      </>
                    )}
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground">
                  Meeting ID: {meetingId}
                </p>
              </CardContent>
            </Card>
          </TabsContent>

          {/* ── Tab 1: Members ── */}
          <TabsContent value="members">
            <div className="flex items-center justify-between mb-5">
              <div>
                <h2 className="text-base font-semibold">成員列表</h2>
                <p className="text-sm text-muted-foreground mt-0.5">
                  共 {members.length} 位成員
                </p>
              </div>
              <Dialog open={open} onOpenChange={setOpen}>
                <DialogTrigger asChild>
                  <Button size="sm" className="gap-1.5">
                    <Plus className="w-4 h-4" />
                    加入成員
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-xs">
                  <DialogHeader>
                    <DialogTitle>加入新成員</DialogTitle>
                  </DialogHeader>
                  <div className="flex flex-col gap-3 mt-2">
                    <Input
                      placeholder="輸入成員名稱"
                      value={newName}
                      onChange={(e) => setNewName(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && addMember()}
                      autoFocus
                    />
                    <Button onClick={addMember} disabled={!newName.trim()}>
                      確認加入
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {members.map((m) => (
                <Card key={m.id}>
                  <CardContent className="p-4 flex items-center gap-3">
                    <Avatar className="w-10 h-10 shrink-0">
                      <AvatarFallback
                        className={`${m.color} text-white text-sm font-semibold`}
                      >
                        {m.name[0]}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm truncate">{m.name}</p>
                      <p className="text-xs text-muted-foreground">
                        已評分 {Object.keys(m.ratings).length} 個時段
                      </p>
                    </div>
                    <Badge variant={m.submitted ? "default" : "secondary"}>
                      {m.submitted ? "已送出" : "填寫中"}
                    </Badge>
                    {m.id === "me" && (
                      <Badge variant="outline" className="text-xs shrink-0">
                        你
                      </Badge>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          {/* ── Tab 2: My Schedule ── */}
          <TabsContent value="my-schedule">
            <div className="mb-5">
              <h2 className="text-base font-semibold">設定候選時段 + 我的評分</h2>
              <p className="text-sm text-muted-foreground mt-0.5">
                先用拖曳選擇候選時段，再對每個時段評分 0-5
              </p>
            </div>
            <Card>
              <CardContent className="pt-6">
                <Legend
                  items={[
                    { color: "bg-primary", label: "候選時段" },
                    { color: "bg-muted border border-border", label: "非候選" },
                  ]}
                />
                <ScheduleGrid
                  activeSlots={candidateSlots}
                  onBatchToggle={batchToggleCandidateSlots}
                />
                <div className="mt-5 space-y-3">
                  <h3 className="text-sm font-semibold">我的評分（0-5）</h3>
                  {me.submitted && (
                    <div className="text-sm px-3 py-2 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800 dark:bg-emerald-950 dark:border-emerald-800 dark:text-emerald-200">
                      已送出你的評分，若重新修改分數會自動回到「填寫中」狀態。
                    </div>
                  )}
                  {candidateSlots.length === 0 ? (
                    <p className="text-sm text-muted-foreground">
                      尚未設定候選時段
                    </p>
                  ) : (
                    candidateSlots.map((s) => (
                      <div
                        key={s}
                        className="flex flex-wrap items-center gap-2 border rounded-lg p-3"
                      >
                        <span className="text-sm min-w-40">{toLabel(s)}</span>
                        {Array.from({ length: 6 }, (_, i) => (
                          <Button
                            key={`${s}-${i}`}
                            size="sm"
                            variant={me.ratings[s] === i ? "default" : "outline"}
                            onClick={() => setMyRating(s, i)}
                          >
                            {i}
                          </Button>
                        ))}
                      </div>
                    ))
                  )}
                  <Button
                    onClick={submitMyRatings}
                    disabled={candidateSlots.length === 0 || me.submitted}
                  >
                    {me.submitted ? "已送出評分" : "送出我的評分"}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* ── Tab 3: View Member ── */}
          <TabsContent value="view-member">
            <div className="mb-5">
              <h2 className="text-base font-semibold">查看成員時間表</h2>
              <p className="text-sm text-muted-foreground mt-0.5">
                選擇成員查看每個候選時段評分
              </p>
            </div>

            {others.length === 0 ? (
              <p className="text-muted-foreground text-sm py-12 text-center">
                尚無其他成員，請先在「成員」頁加入
              </p>
            ) : (
              <>
                <div className="flex flex-wrap gap-2 mb-5">
                  {others.map((m) => (
                    <Button
                      key={m.id}
                      variant={viewing?.id === m.id ? "default" : "outline"}
                      size="sm"
                      onClick={() => setViewId(m.id)}
                    >
                      {m.name}
                    </Button>
                  ))}
                </div>

                {viewing && (
                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="flex items-center gap-2 text-base font-semibold">
                        <Avatar className="w-7 h-7">
                          <AvatarFallback
                            className={`${viewing.color} text-white text-xs font-semibold`}
                          >
                            {viewing.name[0]}
                          </AvatarFallback>
                        </Avatar>
                        {viewing.name} 的時間表
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                        {candidateSlots.length === 0 ? (
                          <p className="text-sm text-muted-foreground">
                            尚未設定候選時段
                          </p>
                        ) : (
                          candidateSlots.map((s) => (
                            <div
                              key={s}
                              className="text-sm px-3 py-2 rounded-lg bg-muted border border-border flex items-center justify-between"
                            >
                              <span>{toLabel(s)}</span>
                              <Badge
                                variant={
                                  (viewing.ratings[s] ?? 0) >= 4
                                    ? "default"
                                    : "secondary"
                                }
                              >
                                {viewing.ratings[s] ?? 0} 分
                              </Badge>
                            </div>
                          ))
                        )}
                      </div>
                    </CardContent>
                  </Card>
                )}
              </>
            )}
          </TabsContent>

          {/* ── Tab 4: Common Availability ── */}
          <TabsContent value="common">
            <div className="mb-5">
              <h2 className="text-base font-semibold">最佳開會時段（分數總和）</h2>
              <p className="text-sm text-muted-foreground mt-0.5">
                需全員送出後才會產生結果，顏色越深代表分數越高
              </p>
            </div>

            <Card>
              <CardContent className="pt-6">
                <Legend
                  items={[
                    { color: "bg-emerald-500", label: "高分時段（深色）" },
                    { color: "bg-emerald-200", label: "低分時段（淺色）" },
                  ]}
                />
                {!allSubmitted ? (
                  <p className="text-center text-muted-foreground py-10 text-sm">
                    尚未全部成員送出評分（{members.filter((m) => m.submitted).length}/
                    {members.length}）
                  </p>
                ) : (
                  <ScoreHeatmapGrid
                    candidateSlots={candidateSlots}
                    totals={slotTotals}
                    bestSlot={bestSlot}
                  />
                )}
              </CardContent>
            </Card>

            {allSubmitted && bestSlot && (
              <Card className="mt-4 border-yellow-300/60">
                <CardContent className="pt-6">
                  <div className="flex items-center gap-2 text-yellow-700 dark:text-yellow-400">
                    <Trophy className="w-4 h-4" />
                    <span className="text-sm font-medium">推薦開會時段</span>
                  </div>
                  <p className="mt-2 text-base font-semibold">
                    {toLabel(bestSlot)}（總分 {bestScore}）
                  </p>
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
