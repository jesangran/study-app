export type MotiveQuote =
  | {
      kind: 'text';
      lang: 'ko' | 'en' | 'ja' | 'zh' | 'fr' | 'es' | 'de' | 'it' | 'pt' | 'la';
      langLabel: string;
      text: string;
      /** 한국어가 아닐 때 병기 */
      meaningKo?: string;
    }
  | {
      kind: 'idiom';
      /** 한문(한자) */
      hanja: string;
      /** 독음 */
      reading: string;
      meaningKo: string;
    }
  | {
      kind: 'proverb';
      text: string;
      meaningKo: string;
    };

export const MOTIVE_QUOTES: MotiveQuote[] = [
  // —— 한국어 ——
  {
    kind: 'text',
    lang: 'ko',
    langLabel: '한국어',
    text: '오늘도 작은 한 걸음이면 충분해요.',
  },
  {
    kind: 'text',
    lang: 'ko',
    langLabel: '한국어',
    text: '천천히 가도, 멈추지만 않으면 돼요.',
  },
  {
    kind: 'text',
    lang: 'ko',
    langLabel: '한국어',
    text: '지금의 노력이 내일의 나를 만들어요.',
  },
  {
    kind: 'text',
    lang: 'ko',
    langLabel: '한국어',
    text: '완벽보다 꾸준함이 더 멀리 가요.',
  },
  {
    kind: 'text',
    lang: 'ko',
    langLabel: '한국어',
    text: '당신은 이미 시작했다는 것만으로도 대단해요.',
  },
  {
    kind: 'text',
    lang: 'ko',
    langLabel: '한국어',
    text: '포기하지 마세요. 끈기가 실력을 앞질러요.',
  },
  {
    kind: 'text',
    lang: 'ko',
    langLabel: '한국어',
    text: '한 번 더 해보면, 길이 보여요.',
  },
  {
    kind: 'text',
    lang: 'ko',
    langLabel: '한국어',
    text: '넘어져도 괜찮아요. 다시 일어서는 사람이 이겨요.',
  },
  {
    kind: 'text',
    lang: 'ko',
    langLabel: '한국어',
    text: '버티는 힘이 곧 성장이에요.',
  },

  // —— 영어 ——
  {
    kind: 'text',
    lang: 'en',
    langLabel: 'English',
    text: 'Little by little, one travels far.',
    meaningKo: '조금씩, 멀리 가게 돼요.',
  },
  {
    kind: 'text',
    lang: 'en',
    langLabel: 'English',
    text: 'Progress, not perfection.',
    meaningKo: '완벽이 아니라 성장이에요.',
  },
  {
    kind: 'text',
    lang: 'en',
    langLabel: 'English',
    text: 'The secret of getting ahead is getting started.',
    meaningKo: '앞서가는 비결은 시작하는 것이에요.',
  },
  {
    kind: 'text',
    lang: 'en',
    langLabel: 'English',
    text: 'You are capable of more than you know.',
    meaningKo: '당신은 생각보다 더 많은 걸 할 수 있어요.',
  },
  {
    kind: 'text',
    lang: 'en',
    langLabel: 'English',
    text: 'Fall seven times, stand up eight.',
    meaningKo: '일곱 번 넘어져도 여덟 번 일어서요.',
  },
  {
    kind: 'text',
    lang: 'en',
    langLabel: 'English',
    text: 'Don’t give up. Grit gets you further than talent.',
    meaningKo: '포기하지 마세요. 끈기가 재능보다 멀리 가요.',
  },
  {
    kind: 'text',
    lang: 'en',
    langLabel: 'English',
    text: 'It always seems impossible until it’s done.',
    meaningKo: '해내기 전엔 늘 불가능해 보여요.',
  },
  {
    kind: 'text',
    lang: 'en',
    langLabel: 'English',
    text: 'Persistence can change failure into extraordinary achievement.',
    meaningKo: '끈기는 실패를 놀라운 성취로 바꿔요.',
  },
  {
    kind: 'text',
    lang: 'en',
    langLabel: 'English',
    text: 'Keep going. You’re closer than you think.',
    meaningKo: '계속 가요. 생각보다 가까이 와 있어요.',
  },

  // —— 일본어 ——
  {
    kind: 'text',
    lang: 'ja',
    langLabel: '日本語',
    text: '継続は力なり。',
    meaningKo: '지속은 힘이에요.',
  },
  {
    kind: 'text',
    lang: 'ja',
    langLabel: '日本語',
    text: '千里の道も一歩から。',
    meaningKo: '천 리 길도 한 걸음부터예요.',
  },
  {
    kind: 'text',
    lang: 'ja',
    langLabel: '日本語',
    text: '今日できることを、今日やろう。',
    meaningKo: '오늘 할 수 있는 일은 오늘 해요.',
  },
  {
    kind: 'text',
    lang: 'ja',
    langLabel: '日本語',
    text: '諦めなければ、道は開ける。',
    meaningKo: '포기하지 않으면 길이 열려요.',
  },
  {
    kind: 'text',
    lang: 'ja',
    langLabel: '日本語',
    text: '七転び八起き。',
    meaningKo: '일곱 번 넘어져도 여덟 번 일어서요.',
  },

  // —— 중국어 ——
  {
    kind: 'text',
    lang: 'zh',
    langLabel: '中文',
    text: '一步一个脚印。',
    meaningKo: '한 걸음씩 차근차근 가요.',
  },
  {
    kind: 'text',
    lang: 'zh',
    langLabel: '中文',
    text: '坚持就是胜利。',
    meaningKo: '포기하지 않으면 이길 수 있어요.',
  },
  {
    kind: 'text',
    lang: 'zh',
    langLabel: '中文',
    text: '学无止境。',
    meaningKo: '배움에는 끝이 없어요.',
  },
  {
    kind: 'text',
    lang: 'zh',
    langLabel: '中文',
    text: '永不放弃。',
    meaningKo: '절대 포기하지 마세요.',
  },
  {
    kind: 'text',
    lang: 'zh',
    langLabel: '中文',
    text: '只要功夫深，铁杵磨成针。',
    meaningKo: '꾸준히 하면 쇠절구공이도 바늘이 돼요.',
  },

  // —— 프랑스어 ——
  {
    kind: 'text',
    lang: 'fr',
    langLabel: 'Français',
    text: 'Petit à petit, l’oiseau fait son nid.',
    meaningKo: '조금씩, 새가 둥지를 지어요.',
  },
  {
    kind: 'text',
    lang: 'fr',
    langLabel: 'Français',
    text: 'Qui veut peut.',
    meaningKo: '뜻이 있는 곳에 길이 있어요.',
  },
  {
    kind: 'text',
    lang: 'fr',
    langLabel: 'Français',
    text: 'Il ne faut jamais abandonner.',
    meaningKo: '절대 포기해서는 안 돼요.',
  },
  {
    kind: 'text',
    lang: 'fr',
    langLabel: 'Français',
    text: 'La persévérance vient à bout de tout.',
    meaningKo: '끈기는 결국 모든 걸 이겨내요.',
  },

  // —— 스페인어 ——
  {
    kind: 'text',
    lang: 'es',
    langLabel: 'Español',
    text: 'Poco a poco se anda lejos.',
    meaningKo: '조금씩 가면 멀리 가요.',
  },
  {
    kind: 'text',
    lang: 'es',
    langLabel: 'Español',
    text: 'No hay atajo sin trabajo.',
    meaningKo: '노력 없는 지름길은 없어요.',
  },
  {
    kind: 'text',
    lang: 'es',
    langLabel: 'Español',
    text: 'No te rindas. La constancia lo puede todo.',
    meaningKo: '포기하지 마세요. 꾸준함이 모든 걸 해내요.',
  },
  {
    kind: 'text',
    lang: 'es',
    langLabel: 'Español',
    text: 'Caerse está permitido. Levantarse es obligatorio.',
    meaningKo: '넘어져도 괜찮아요. 일어서는 건 필수예요.',
  },

  // —— 독일어 ——
  {
    kind: 'text',
    lang: 'de',
    langLabel: 'Deutsch',
    text: 'Übung macht den Meister.',
    meaningKo: '연습이 달인을 만들어요.',
  },
  {
    kind: 'text',
    lang: 'de',
    langLabel: 'Deutsch',
    text: 'Der Weg ist das Ziel.',
    meaningKo: '과정이 곧 목표예요.',
  },
  {
    kind: 'text',
    lang: 'de',
    langLabel: 'Deutsch',
    text: 'Gib nicht auf. Ausdauer schafft Wunder.',
    meaningKo: '포기하지 마세요. 끈기가 기적을 만들어요.',
  },
  {
    kind: 'text',
    lang: 'de',
    langLabel: 'Deutsch',
    text: 'Steh immer wieder auf.',
    meaningKo: '매번 다시 일어서요.',
  },

  // —— 이탈리아어 ——
  {
    kind: 'text',
    lang: 'it',
    langLabel: 'Italiano',
    text: 'Chi va piano va sano e va lontano.',
    meaningKo: '천천히 가는 사람이 멀리, 건강히 가요.',
  },
  {
    kind: 'text',
    lang: 'it',
    langLabel: 'Italiano',
    text: 'Non mollare mai.',
    meaningKo: '절대 포기하지 마세요.',
  },
  {
    kind: 'text',
    lang: 'it',
    langLabel: 'Italiano',
    text: 'La costanza porta al successo.',
    meaningKo: '꾸준함이 성공으로 이끌어요.',
  },

  // —— 포르투갈어 ——
  {
    kind: 'text',
    lang: 'pt',
    langLabel: 'Português',
    text: 'Água mole em pedra dura tanto bate até que fura.',
    meaningKo: '부드러운 물도 바위를 뚫어요.',
  },
  {
    kind: 'text',
    lang: 'pt',
    langLabel: 'Português',
    text: 'Não desista. A persistência vence.',
    meaningKo: '포기하지 마세요. 끈기가 이겨요.',
  },

  // —— 라틴어 ——
  {
    kind: 'text',
    lang: 'la',
    langLabel: 'Latina',
    text: 'Per aspera ad astra.',
    meaningKo: '험한 길을 지나 별에 닿아요.',
  },
  {
    kind: 'text',
    lang: 'la',
    langLabel: 'Latina',
    text: 'Carpe diem.',
    meaningKo: '오늘을 잡아요.',
  },
  {
    kind: 'text',
    lang: 'la',
    langLabel: 'Latina',
    text: 'Nil desperandum.',
    meaningKo: '절망할 일은 없어요.',
  },
  {
    kind: 'text',
    lang: 'la',
    langLabel: 'Latina',
    text: 'Gutta cavat lapidem.',
    meaningKo: '물방울이 바위를 뚫어요.',
  },

  // —— 속담 ——
  {
    kind: 'proverb',
    text: '천 리 길도 한 걸음부터.',
    meaningKo: '큰일도 작은 시작에서 이뤄져요.',
  },
  {
    kind: 'proverb',
    text: '티끌 모아 태산.',
    meaningKo: '작은 노력이 모여 큰 성과가 돼요.',
  },
  {
    kind: 'proverb',
    text: '시작이 반이다.',
    meaningKo: '시작하는 것만으로도 이미 절반은 온 거예요.',
  },
  {
    kind: 'proverb',
    text: '고생 끝에 낙이 온다.',
    meaningKo: '힘든 시간을 지나면 좋은 결과가 따라와요.',
  },
  {
    kind: 'proverb',
    text: '낙숫물이 바위를 뚫는다.',
    meaningKo: '꾸준하면 단단한 것도 결국 열려요.',
  },
  {
    kind: 'proverb',
    text: '급할수록 돌아가라.',
    meaningKo: '서두르기보다 차근차근이 더 빨라요.',
  },

  // —— 사자성어 ——
  {
    kind: 'idiom',
    hanja: '愚公移山',
    reading: '우공이산',
    meaningKo: '우공이 산을 옮기듯, 꾸준하면 큰일도 해내요.',
  },
  {
    kind: 'idiom',
    hanja: '百折不屈',
    reading: '백절불굴',
    meaningKo: '백 번 꺾여도 굽히지 않아요.',
  },
  {
    kind: 'idiom',
    hanja: '日就月將',
    reading: '일취월장',
    meaningKo: '나날이, 달마다 실력이 늘어요.',
  },
  {
    kind: 'idiom',
    hanja: '勤勉努力',
    reading: '근면노력',
    meaningKo: '부지런히 힘쓰면 길이 열려요.',
  },
  {
    kind: 'idiom',
    hanja: '自强不息',
    reading: '자강불식',
    meaningKo: '스스로 힘쓰기를 멈추지 않아요.',
  },
  {
    kind: 'idiom',
    hanja: '積小成大',
    reading: '적소성대',
    meaningKo: '작은 것이 쌓여 큰 것이 돼요.',
  },
  {
    kind: 'idiom',
    hanja: '有志竟成',
    reading: '유지경성',
    meaningKo: '뜻이 있으면 결국 이뤄져요.',
  },
  {
    kind: 'idiom',
    hanja: '切磋琢磨',
    reading: '절차탁마',
    meaningKo: '서로 갈고닦으며 성장해요.',
  },
  {
    kind: 'idiom',
    hanja: '臥薪嘗膽',
    reading: '와신상담',
    meaningKo: '뜻을 품고 견디면 때가 와요.',
  },
  {
    kind: 'idiom',
    hanja: '不撓不屈',
    reading: '불요불굴',
    meaningKo: '휘지도 굽히지도 않아요.',
  },
  {
    kind: 'idiom',
    hanja: '堅持到底',
    reading: '견지때도',
    meaningKo: '끝까지 붙잡고 밀고 나가요.',
  },
  {
    kind: 'idiom',
    hanja: '再接再厲',
    reading: '재접재려',
    meaningKo: '멈추지 말고 다시 힘을 내요.',
  },
  {
    kind: 'idiom',
    hanja: '金石可鏤',
    reading: '금석가루',
    meaningKo: '금과 돌도 깎을 수 있듯, 끈기가 어려움을 이겨요.',
  },
  {
    kind: 'idiom',
    hanja: '滴水穿石',
    reading: '적수천석',
    meaningKo: '물방울이 바위를 뚫듯, 꾸준하면 돼요.',
  },
  {
    kind: 'idiom',
    hanja: '堅忍不拔',
    reading: '견인불발',
    meaningKo: '굳세게 참아내고 흔들리지 않아요.',
  },
];

export type IdiomQuote = Extract<MotiveQuote, { kind: 'idiom' }>;

const IDIOMS: IdiomQuote[] = MOTIVE_QUOTES.filter((q): q is IdiomQuote => q.kind === 'idiom');

export function pickIdiom(excludeIndex?: number): { quote: IdiomQuote; index: number } {
  if (IDIOMS.length === 0) {
    return {
      quote: { kind: 'idiom', hanja: '日新又新', reading: '일신우신', meaningKo: '날마다 새롭게.' },
      index: 0,
    };
  }
  if (IDIOMS.length === 1) return { quote: IDIOMS[0], index: 0 };
  let index = Math.floor(Math.random() * IDIOMS.length);
  if (excludeIndex != null && index === excludeIndex) {
    index = (index + 1) % IDIOMS.length;
  }
  return { quote: IDIOMS[index], index };
}

const LANG_NAME: Record<string, string> = {
  ko: '한국어',
  en: '영어',
  ja: '일본어',
  zh: '중국어',
  fr: '프랑스어',
  es: '스페인어',
  de: '독일어',
  it: '이탈리아어',
  pt: '포르투갈어',
  la: '라틴어',
};

export function describeMotive(quote: MotiveQuote): {
  category: '사자성어' | '명언' | '속담';
  language: string;
  lead: string;
  rest: string;
} {
  if (quote.kind === 'idiom') {
    return {
      category: '사자성어',
      language: '한문',
      lead: quote.hanja,
      rest: `${quote.reading} · ${quote.meaningKo}`,
    };
  }
  if (quote.kind === 'proverb') {
    return {
      category: '속담',
      language: '한국어',
      lead: quote.text,
      rest: quote.meaningKo,
    };
  }
  return {
    category: '명언',
    language: LANG_NAME[quote.lang] ?? quote.langLabel,
    lead: quote.text,
    rest: quote.lang === 'ko' ? '' : (quote.meaningKo ?? ''),
  };
}

export function pickMotiveQuote(excludeIndex?: number): { quote: MotiveQuote; index: number } {
  if (MOTIVE_QUOTES.length === 0) {
    return {
      quote: {
        kind: 'text',
        lang: 'ko',
        langLabel: '한국어',
        text: '오늘도 화이팅!',
      },
      index: 0,
    };
  }
  if (MOTIVE_QUOTES.length === 1) {
    return { quote: MOTIVE_QUOTES[0], index: 0 };
  }
  let index = Math.floor(Math.random() * MOTIVE_QUOTES.length);
  if (excludeIndex != null && index === excludeIndex) {
    index = (index + 1) % MOTIVE_QUOTES.length;
  }
  return { quote: MOTIVE_QUOTES[index], index };
}
