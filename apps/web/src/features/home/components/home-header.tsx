import type { HomeSummary } from '@lastly/contracts';
import Link from 'next/link';

import { formatHeaderDate, formatShortDate } from '@/lib/date';

/** 설계 05 상단 — 날짜·백업 상태·헤드라인, 오른쪽에 설정. */
export function HomeHeader({
  summary,
  today,
  empty,
}: {
  summary: HomeSummary;
  today: Date;
  /** 설계 04 — 기록이 없으면 인사만 건넨다. */
  empty?: boolean;
}) {
  return (
    <header className="safe-top px-1 pt-2">
      {/* 첫 줄은 날짜와 이름. 작고 흐리게 두어 아래 헤드라인이 먼저 읽히게 한다. */}
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0 truncate text-13 text-ink-3">
          {formatHeaderDate(today)}
          {!empty && summary.greetingName ? ` · ${summary.greetingName}님` : ''}
        </div>

        <Link href="/settings" aria-label="설정" className="shrink-0">
          <GearIcon />
        </Link>
      </div>

      <div className="mt-2 flex items-center justify-between gap-3">
        {empty ? (
          <h1 className="min-w-0 text-[22px] font-bold tracking-t3 text-ink">
            안녕하세요{summary.greetingName ? `, ${summary.greetingName}님` : ''}
          </h1>
        ) : (
          <h1 className="min-w-0 text-23 font-bold tracking-t35 text-ink">{headline(summary)}</h1>
        )}
      </div>
    </header>
  );
}

/**
 * 설계 05 는 "오늘 챙길 가사 2개" 처럼 셈만 말한다.
 *
 * dueTodayCount 는 이미 밀린 항목까지 세고 있다(서버의 due 버킷 크기 그대로).
 * 여기에 overdueCount 를 더하면 밀린 것이 두 번 세어져 카드 수와 어긋난다.
 */
function headline(summary: HomeSummary): string {
  // 0 일 때도 셈으로 말한다. "없어요" 는 바로 아래 카드가 하는 말이라 겹친다.
  return `오늘 챙길 가사 ${summary.dueTodayCount}개`;
}

/**
 * 오늘 챙길 게 없는 날 — 설계 05-E.
 *
 * 히어로 캐러셀이 서던 자리를 그대로 쓴다. 빈칸으로 두면 화면이 무너져
 * "오늘은 할 게 없다" 가 아니라 "뭔가 안 불러왔다" 로 읽힌다.
 * 방금 다 끝냈을 때(05-B)와 애초에 없던 날(05-E)의 말이 다르다.
 */
export function AllDoneCard({ summary, justFinished }: { summary: HomeSummary; justFinished?: boolean }) {
  return (
    <div className="mt-4 rounded-card border border-line-2 bg-[linear-gradient(180deg,var(--lastly-card-hi-from),var(--lastly-card-hi-to))] px-5 py-[26px] text-center">
      <p className="text-20 font-bold tracking-t3 text-ink">
        {justFinished ? '오늘 할 건 다 하셨어요 🎉' : '오늘 챙길 가사가 없어요 🌿'}
      </p>
      <p className="mt-2 text-[13.5px] text-ink-2">
        {summary.nextUp
          ? `${justFinished ? '' : '편안한 하루 보내세요. '}다음은 ${formatShortDate(summary.nextUp.dueOn)} · ${summary.nextUp.name}예요`
          : '편안한 하루 보내세요.'}
      </p>
    </div>
  );
}

function GearIcon() {
  return (
    <svg
      width="22"
      height="22"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="text-ink-2"
      aria-hidden
    >
      <circle cx="12" cy="12" r="3.2" />
      <path d="M19.4 15a1.6 1.6 0 0 0 .32 1.77l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.6 1.6 0 0 0-1.77-.32 1.6 1.6 0 0 0-.97 1.47V21a2 2 0 1 1-4 0v-.11a1.6 1.6 0 0 0-1.05-1.46 1.6 1.6 0 0 0-1.77.32l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06A1.6 1.6 0 0 0 4.6 15a1.6 1.6 0 0 0-1.47-.97H3a2 2 0 1 1 0-4h.11A1.6 1.6 0 0 0 4.6 9a1.6 1.6 0 0 0-.32-1.77l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06A1.6 1.6 0 0 0 9 4.72h.08A1.6 1.6 0 0 0 10 3.25V3a2 2 0 1 1 4 0v.11a1.6 1.6 0 0 0 .97 1.47 1.6 1.6 0 0 0 1.77-.32l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06A1.6 1.6 0 0 0 19.28 9v.08a1.6 1.6 0 0 0 1.47.97H21a2 2 0 1 1 0 4h-.11a1.6 1.6 0 0 0-1.47.97Z" />
    </svg>
  );
}
