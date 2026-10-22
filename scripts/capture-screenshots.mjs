/**
 * StudyBuddy 주요 화면 캡처 (Expo web)
 * 실행: node scripts/capture-screenshots.mjs
 */
import { chromium } from 'playwright';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUT = path.join(__dirname, '..', 'docs', 'screenshots');
const BASE = process.env.STUDYBUDDY_URL || 'http://localhost:8081';

fs.mkdirSync(OUT, { recursive: true });

const user = {
  id: 'u_demo_capture',
  email: 'demo@kakao.com',
  emailVerified: true,
  nickname: '캡쳐토끼',
  providers: ['kakao'],
  emailsByProvider: { kakao: 'demo@kakao.com' },
  lastProvider: 'kakao',
  createdAt: '2026-09-01T00:00:00.000Z',
};

function buildState() {
  const now = new Date();
  const notifications = [];
  const kinds = [
    ['schedule_created', '일정 등록', 'DFS/BFS 문제풀이 일정이 등록됐어요.'],
    ['assignment_created', '과제 등록', '백준 1920번 풀이 정리 과제가 올라왔어요.'],
    ['notice_created', '새 공지', '이번 주 Zoom 링크 변경 안내'],
    ['member_joined', '스터디원 가입', '밤샘펭귄님이 알고리즘 밤샘반에 들어왔어요.'],
    ['lead_offered', '스터디장 위임 요청', '알고냥이님에게 위임 요청을 보냈어요.'],
  ];
  for (let i = 0; i < 20; i++) {
    const [kind, title, body] = kinds[i % kinds.length];
    const d = new Date(now);
    d.setHours(d.getHours() - i * 3);
    notifications.push({
      id: `notif_cap_${i + 1}`,
      kind,
      title,
      body: `🧩 ${body}`,
      createdAt: d.toISOString(),
      studyId: 's1',
      studyName: '알고리즘 밤샘반',
      read: i >= 5,
    });
  }

  return {
    user,
    accounts: [user],
    autoLogin: true,
    lastLogin: {
      provider: 'kakao',
      email: user.email,
      nickname: user.nickname,
      userId: user.id,
      at: now.toISOString(),
    },
    joinedStudyIds: ['s1', 's2'],
    adminStudyIds: ['s1'],
    attendedIds: ['a1'],
    submittedAssignmentIds: ['hw1'],
    assignmentSubmissions: {},
    customSchedules: [],
    scheduleEdits: {},
    deletedScheduleIds: [],
    customNotices: [],
    noticeEdits: {},
    deletedNoticeIds: [],
    customAssignments: [],
    assignmentEdits: {},
    deletedAssignmentIds: [],
    customStudies: [],
    deletedStudyIds: [],
    leadOffers: [],
    studyLeads: {},
    notifications,
    notificationSeedVersion: 5,
  };
}

async function wait(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

async function shot(page, name) {
  await wait(600);
  await page.screenshot({ path: path.join(OUT, `${name}.png`), fullPage: false });
  console.log('saved', name);
}

async function seedLoggedIn(page) {
  const state = buildState();
  await page.addInitScript((payload) => {
    window.localStorage.setItem('studybuddy.v4', JSON.stringify(payload));
  }, state);
}

async function seedLoggedOut(page) {
  await page.addInitScript(() => {
    window.localStorage.removeItem('studybuddy.v4');
    window.localStorage.removeItem('studybuddy.v1');
  });
}

async function go(page, route) {
  await page.goto(`${BASE}${route}`, { waitUntil: 'domcontentloaded', timeout: 60000 });
  await wait(2200);
}

async function main() {
  const browser = await chromium.launch({ headless: true });

  // 1) 로그인 화면
  {
    const context = await browser.newContext({
      viewport: { width: 390, height: 844 },
      deviceScaleFactor: 2,
      isMobile: true,
      hasTouch: true,
    });
    const page = await context.newPage();
    await seedLoggedOut(page);
    await go(page, '/');
    await shot(page, '01-login');
    await context.close();
  }

  // 2) 로그인된 주요 화면들
  {
    const context = await browser.newContext({
      viewport: { width: 390, height: 844 },
      deviceScaleFactor: 2,
      isMobile: true,
      hasTouch: true,
    });
    const page = await context.newPage();
    await seedLoggedIn(page);

    await go(page, '/');
    await shot(page, '02-home');

    // 알림 미리보기 (종 버튼)
    const bell = page.getByLabel(/알림/);
    if (await bell.count()) {
      await bell.first().click({ force: true });
      await wait(800);
      await shot(page, '03-notification-preview');
      const more = page.getByText(/더보기|알림함 보기/);
      if (await more.count()) {
        await more.first().click({ force: true });
        await wait(1500);
      } else {
        await go(page, '/notifications');
      }
    } else {
      await go(page, '/notifications');
    }
    await shot(page, '04-notifications');

    await go(page, '/schedule');
    await shot(page, '05-schedule');

    await go(page, '/stats');
    await shot(page, '06-stats');

    await go(page, '/profile');
    await shot(page, '07-profile');
    await page.evaluate(() => window.scrollTo(0, 99999));
    await wait(500);
    await shot(page, '08-profile-withdraw');

    await go(page, '/studies/s1');
    await shot(page, '09-study-home');

    await go(page, '/studies/s1/members');
    await shot(page, '10-study-members');

    await go(page, '/studies/join');
    await shot(page, '11-study-join');

    await context.close();
  }

  console.log('done ->', OUT);
  await browser.close();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
