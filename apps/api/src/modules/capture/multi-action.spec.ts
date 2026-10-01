import { readUtterance, splitUtterances } from '@lastly/parser';

const REFERENCE_DATE = new Date(2026, 8, 13); // 2026-09-13, 일요일

describe('여러 행동 골든 테스트', () => {
  it.each([
    [
      '오늘 책읽음 그리고 주방후드 청소함',
      [
        { text: '오늘 책읽음', name: '책 읽기', daysAgo: 0, willSave: true },
        { text: '오늘 주방후드 청소함', name: '주방후드 청소', daysAgo: 0, willSave: true },
      ],
    ],
    [
      '일요일 책읽음, 주방후드 청소함',
      [
        { text: '일요일 책읽음', name: '책 읽기', daysAgo: 0, willSave: true },
        { text: '일요일 주방후드 청소함', name: '주방후드 청소', daysAgo: 0, willSave: true },
      ],
    ],
    [
      '일요일 책읽음, 토요일 주방후드 청소함',
      [
        { text: '일요일 책읽음', name: '책 읽기', daysAgo: 0, willSave: true },
        { text: '토요일 주방후드 청소함', name: '주방후드 청소', daysAgo: 1, willSave: true },
      ],
    ],
    [
      '오늘 책읽음 그리고 내일 주방후드 청소할 거야',
      [
        { text: '오늘 책읽음', name: '책 읽기', daysAgo: 0, willSave: true },
        { text: '내일 주방후드 청소할 거야', name: '주방후드 청소', daysAgo: 0, willSave: false },
      ],
    ],
    [
      '오늘 책 읽었고 주방후드 청소했어',
      [
        { text: '오늘 책 읽었고', name: '책 읽기', daysAgo: 0, willSave: true },
        { text: '오늘 주방후드 청소했어', name: '주방후드 청소', daysAgo: 0, willSave: true },
      ],
    ],
  ] as const)('%s를 각각 해석한다', (text, expected) => {
    expect(splitUtterances(text)).toEqual(expected.map((part) => part.text));

    expect(
      splitUtterances(text).map((part) => {
        const facts = readUtterance(part, REFERENCE_DATE);
        return {
          name: facts.name,
          daysAgo: facts.daysAgo,
          willSave: facts.willSave,
        };
      }),
    ).toEqual(expected.map(({ name, daysAgo, willSave }) => ({ name, daysAgo, willSave })));
  });
});
