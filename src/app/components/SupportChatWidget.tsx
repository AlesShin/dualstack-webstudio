import { AnimatePresence, motion } from 'motion/react';
import { Bot, ExternalLink, Loader2, MessageCircle, Send, X } from 'lucide-react';
import { FormEvent, useRef, useState } from 'react';

type ChatRole = 'assistant' | 'user';

interface ChatMessage {
  id: string;
  role: ChatRole;
  text: string;
  handoff?: boolean;
}

interface GptSupportResponse {
  reply: string;
  handoff: boolean;
}

const TELEGRAM_SUPPORT_HANDLE = '@DualStackru';
const TELEGRAM_SUPPORT_URL = 'https://t.me/DualStackru';
const CONTACT_EMAIL = 'info@dualstack.ru';
const CONTACT_PHONE = '+7 (916) 212-25-32';
const CONTACT_TELEGRAM = '@DualStack';
const OPENAI_API_URL = 'https://api.openai.com/v1/chat/completions';
const OPENAI_MODEL = import.meta.env.VITE_SUPPORT_MODEL || 'gpt-4o-mini';
const OPENAI_API_KEY = import.meta.env.VITE_OPENAI_API_KEY;
const OPENAI_PROXY_URL = import.meta.env.VITE_OPENAI_API_PROXY_URL;

type GptMode = 'proxy' | 'direct' | 'fallback';
const GPT_MODE: GptMode = OPENAI_PROXY_URL ? 'proxy' : OPENAI_API_KEY ? 'direct' : 'fallback';

const SUPPORT_KNOWLEDGE = `
Компания: DualStack, веб-студия (разработка, SEO, брендинг, поддержка).

Разработка сайтов:
- Готовые сайты: от 24 900 ₽, срок 3-7 дней.
- Сайт-визитка: от 29 900 ₽, срок 7-12 дней.
- Сайт-портфолио: по запросу, срок после оценки структуры и количества кейсов.
- Landing page: от 44 900 ₽, срок 10-14 дней.
- Корпоративный сайт: от 79 900 ₽, срок 3-6 недель.
- Digital-стратегия: от 65 000 ₽, срок 1-2 недели.
- Индивидуальные решения: от 120 000 ₽, срок от 4 недель.
- Доработка сайта: по запросу, срок зависит от объёма правок и текущего состояния проекта.
- Интернет-магазин: от 149 000 ₽, срок 6-10 недель.

SEO продвижение:
- В Яндекс: от 35 000 ₽/мес.
- В Google: от 40 000 ₽/мес.
- Комплексное SEO: от 55 000 ₽/мес.
Состав: аудит, семантика, техоптимизация, контентные рекомендации, отчётность.

Брендинг:
- Стратегия бренда: от 85 000 ₽.
- Вербальная идентичность: от 69 000 ₽.
- Визуальная идентичность: от 95 000 ₽.
- Брендбук и айдентика: от 120 000 ₽.
- Маркетинговые коммуникации: от 75 000 ₽.

Акции:
- Старт бизнеса: от 39 900 ₽ (сайт-визитка + базовый SEO-старт).
- Редизайн сайта: от 54 900 ₽.
- Пакет 90 дней: от 89 000 ₽ (сайт + SEO + контент-план).

Как строится работа:
1) Бриф и задачи бизнеса.
2) Оценка бюджета и сроков.
3) Предложение 2-3 решений под цели.
4) Запуск и поддержка.

Контакты:
- Email: info@dualstack.ru
- Телефон: +7 (916) 212-25-32
- Telegram: @DualStack и техподдержка @DualStackru
`.trim();

const GPT_SYSTEM_PROMPT = `
Ты — старший ассистент техподдержки веб-студии DualStack.
Цели:
1) Давать максимально полезные, точные и разнообразные ответы по сайту/услугам/срокам/стоимости.
2) Не повторять одну и ту же формулировку из ответа в ответ.
3) Если вопрос неясный — задавать 1-2 уточняющих вопроса, а не отвечать шаблонно.
4) Если вопрос вне контекста студии или требует живого менеджера — ставить handoff=true.

Правила ответа:
- Пиши на русском, понятно и по делу.
- Начинай с прямого ответа в 1 предложении.
- Далее добавляй конкретику в 2-4 пунктах (цены, сроки, что входит, от чего зависит стоимость).
- Если уместно, предложи 2-3 подходящих варианта услуги.
- Завершай коротким следующим шагом или уточняющим вопросом.
- Если вопрос о цене/сроках, указывай диапазон и факторы, влияющие на итог.
- Если вопрос спорный/общий/непонятный — предложи переход в Telegram техподдержки.
- Не придумывай несуществующие услуги и контакты.

Выход только в JSON:
{"reply":"текст ответа","handoff":false}
`.trim();

const QUICK_QUESTIONS = [
  'Сколько стоит сайт?',
  'Какие сроки разработки?',
  'Что выбрать при бюджете до 80 000 ₽?',
  'Как заказать услугу?',
];

type OfferSnapshot = {
  title: string;
  price: string;
  timeline?: string;
  bestFor: string;
};

const DEVELOPMENT_OFFERS: OfferSnapshot[] = [
  { title: 'Готовые сайты', price: 'от 24 900 ₽', timeline: '3-7 дней', bestFor: 'быстрый запуск с ограниченным бюджетом' },
  { title: 'Сайт-визитка', price: 'от 29 900 ₽', timeline: '7-12 дней', bestFor: 'презентация компании и получение заявок' },
  { title: 'Сайт-портфолио', price: 'по запросу', bestFor: 'визуальная презентация кейсов, работ и экспертности' },
  { title: 'Landing page', price: 'от 44 900 ₽', timeline: '10-14 дней', bestFor: 'продвижение одной услуги или продукта' },
  { title: 'Корпоративный сайт', price: 'от 79 900 ₽', timeline: '3-6 недель', bestFor: 'комплексная презентация бизнеса и услуг' },
  { title: 'Digital-стратегия', price: 'от 65 000 ₽', timeline: '1-2 недели', bestFor: 'план роста канала продаж и маркетинга' },
  { title: 'Индивидуальные решения', price: 'от 120 000 ₽', timeline: 'от 4 недель', bestFor: 'нестандартный функционал и интеграции' },
  { title: 'Доработка сайта', price: 'по запросу', bestFor: 'точечные улучшения текущего сайта без полной переработки' },
  { title: 'Интернет-магазин', price: 'от 149 000 ₽', timeline: '6-10 недель', bestFor: 'полноценные онлайн-продажи' },
];

const SEO_OFFERS: OfferSnapshot[] = [
  { title: 'В Яндекс', price: 'от 35 000 ₽/мес', bestFor: 'видимость в Яндексе и локальном поиске' },
  { title: 'В Google', price: 'от 40 000 ₽/мес', bestFor: 'поисковый трафик и коммерческие запросы' },
  { title: 'Комплексное SEO', price: 'от 55 000 ₽/мес', bestFor: 'структура, контент и ключевые запросы' },
];

const BRANDING_OFFERS: OfferSnapshot[] = [
  { title: 'Стратегия бренда', price: 'от 85 000 ₽', bestFor: 'формирование позиционирования и УТП' },
  { title: 'Вербальная идентичность', price: 'от 69 000 ₽', bestFor: 'нейминг, слоган и Tone of Voice' },
  { title: 'Визуальная идентичность', price: 'от 95 000 ₽', bestFor: 'логотип, цвета, шрифты и визуальный язык' },
  { title: 'Брендбук и айдентика', price: 'от 120 000 ₽', bestFor: 'систематизация стиля для сайта и соцсетей' },
  { title: 'Маркетинговые коммуникации', price: 'от 75 000 ₽', bestFor: 'рекламная подача и коммуникации бренда' },
];

const PROMO_OFFERS: OfferSnapshot[] = [
  { title: 'Старт бизнеса', price: 'от 39 900 ₽', timeline: 'до 10 дней', bestFor: 'быстрый выход в онлайн' },
  { title: 'Редизайн сайта', price: 'от 54 900 ₽', timeline: '2-4 недели', bestFor: 'обновление текущего сайта и пути пользователя' },
  { title: 'Пакет 90 дней', price: 'от 89 000 ₽', timeline: '90 дней', bestFor: 'сайт + SEO + контент-план на старт' },
];

function formatOffers(offers: OfferSnapshot[]): string {
  return offers
    .map((offer) =>
      offer.timeline
        ? `• ${offer.title}: ${offer.price}, срок ${offer.timeline} — ${offer.bestFor}.`
        : `• ${offer.title}: ${offer.price} — ${offer.bestFor}.`,
    )
    .join('\n');
}

function createId() {
  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function hashString(value: string): number {
  let hash = 0;
  for (let i = 0; i < value.length; i += 1) {
    hash = (hash << 5) - hash + value.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash);
}

function pickVariant(variants: string[], seed: string): string {
  return variants[hashString(seed) % variants.length];
}

function normalizeText(text: string): string {
  return text.toLowerCase().replace(/[^\p{L}\p{N}\s]/gu, ' ').replace(/\s+/g, ' ').trim();
}

function isAffirmationMessage(text: string): boolean {
  const normalized = normalizeText(text);
  return /^(да|давай|ок|окей|хорошо|поехали|погнали|го|угу|ага|yes|yep)$/.test(normalized);
}

function buildClarifyingPrompt(history: ChatMessage[], question: string): string {
  const userContext = history
    .filter((item) => item.role === 'user')
    .slice(-8)
    .map((item) => normalizeText(item.text))
    .join(' ');

  const merged = `${userContext} ${normalizeText(question)}`.trim();
  const hasDirection = /разработк|сайт|лендинг|визитк|корпоратив|магазин|seo|яндекс|google|брендинг|бренд|айдентик|акци|digital/.test(merged);
  const hasGoal = /заявк|продаж|трафик|узнаваем|имидж|конверс|позици|клиент|заказ|лид/.test(merged);
  const hasDeadline = /срок|дедлайн|срочно|быстро|дн(?:ей|я)?|недел|месяц|до\s+\d{1,2}[./-]\d{1,2}/.test(merged);
  const hasBudget = /бюджет|до\s*\d[\d\s]*(?:₽|руб|р)?|\d[\d\s]*(?:₽|руб|р)\b|тыс|млн|\bk\b/.test(merged);

  const missing: string[] = [];
  if (!hasDirection) {
    missing.push('какое направление нужно: разработка сайта, SEO, брендинг или акция');
  }
  if (!hasGoal) {
    missing.push('какая главная цель: заявки, продажи, трафик или усиление бренда');
  }
  if (!hasDeadline) {
    missing.push('к какому сроку нужен запуск');
  }
  if (!hasBudget) {
    missing.push('какой ориентир по бюджету');
  }

  if (missing.length === 0) {
    return pickVariant(
      [
        'Отлично, данных уже достаточно. Могу сразу предложить 3 варианта: база, оптимум и максимум по срокам и стоимости. Подтверждаете?',
        'Супер, базовые вводные есть. Готов дать точный расклад по пакетам и срокам. Продолжаем?',
        'Хорошо, всё понял. Могу прямо сейчас расписать оптимальный набор работ и итоговую вилку по цене.',
      ],
      `${question}-${history.length}`,
    );
  }

  const checklist = missing
    .slice(0, 3)
    .map((item, index) => `${index + 1}) ${item}?`)
    .join('\n');

  const lead = pickVariant(
    [
      'Отлично, двигаемся дальше. Чтобы не гадать, уточните:',
      'Принято. Для точного предложения нужен короткий бриф:',
      'Хорошо, соберём вводные и сразу дам конкретные варианты:',
    ],
    `${question}-${history.length}`,
  );

  return `${lead}\n${checklist}`;
}

function isTooSimilar(next: string, previous?: string): boolean {
  if (!previous) return false;

  const normalizedNext = normalizeText(next);
  const normalizedPrevious = normalizeText(previous);
  if (!normalizedNext || !normalizedPrevious) return false;
  if (normalizedNext === normalizedPrevious) return true;

  const nextTokens = new Set(normalizedNext.split(' '));
  const previousTokens = new Set(normalizedPrevious.split(' '));
  let common = 0;
  for (const token of nextTokens) {
    if (previousTokens.has(token)) common += 1;
  }

  const minSize = Math.max(1, Math.min(nextTokens.size, previousTokens.size));
  return common / minSize > 0.82;
}

function diversifyReply(reply: string, handoff: boolean, question: string, history: ChatMessage[]): string {
  if (isAffirmationMessage(question)) {
    return buildClarifyingPrompt(history, question);
  }

  const lastAssistant = [...history].reverse().find((item) => item.role === 'assistant')?.text;
  if (!isTooSimilar(reply, lastAssistant)) return reply;

  if (handoff) {
    return pickVariant(
      [
        `Чтобы не терять время, лучше сразу перейти в Telegram ${TELEGRAM_SUPPORT_HANDLE}.`,
        `Рекомендую продолжить в Telegram ${TELEGRAM_SUPPORT_HANDLE} — там быстро подключится человек.`,
      ],
      `${question}-${history.length}`,
    );
  }

  return buildClarifyingPrompt(history, question);
}

function parseGptResponse(content: string): GptSupportResponse {
  const cleaned = content
    .replace(/^```json\s*/i, '')
    .replace(/^```\s*/i, '')
    .replace(/\s*```$/, '')
    .trim();

  try {
    const parsed = JSON.parse(cleaned) as Partial<GptSupportResponse>;
    if (typeof parsed.reply === 'string' && typeof parsed.handoff === 'boolean') {
      return {
        reply: parsed.reply.trim(),
        handoff: parsed.handoff,
      };
    }
  } catch {
    // ignored intentionally
  }

  return {
    reply: cleaned || 'Не удалось распознать ответ модели. Перенаправляю на техподдержку в Telegram.',
    handoff: true,
  };
}

function buildLocalSupportAnswer(question: string, history: ChatMessage[]): GptSupportResponse {
  const text = question.toLowerCase();
  const seed = `${question}-${history.length}`;
  const contactBlock = `Контакты: ${CONTACT_EMAIL}, ${CONTACT_PHONE}, Telegram ${CONTACT_TELEGRAM}.`;

  if (isAffirmationMessage(text)) {
    return {
      reply: buildClarifyingPrompt(history, question),
      handoff: false,
    };
  }

  if (/привет|здравств|добрый|hello|hi/.test(text)) {
    return {
      reply: pickVariant(
        [
          'Привет! Помогу с выбором услуги, ценами, сроками и запуском проекта. Могу сразу предложить 2-3 варианта под ваш бюджет и цель.',
          'Здравствуйте! Подскажу по разработке, SEO, брендингу и акциям с конкретными ориентирами по цене и срокам. Что сейчас актуальнее?',
          'Добрый день! Я ассистент DualStack: могу рассчитать ориентир по стоимости и подсказать лучший формат работ под ваш кейс.',
        ],
        seed,
      ),
      handoff: false,
    };
  }

  if (/контакт|телефон|почт|email|e-mail|telegram|телеграм|связ/.test(text)) {
    return {
      reply: `${contactBlock} Для оперативной техподдержки лучше писать в ${TELEGRAM_SUPPORT_HANDLE}.`,
      handoff: false,
    };
  }

  if (/что выбрать|что лучше|посоветуй|подбери|рекоменд/.test(text)) {
    return {
      reply: `Подберу оптимальный вариант, ориентир:
• Бюджет до 50 000 ₽: готовые сайты или сайт-визитка.
• 50 000–120 000 ₽: лендинг, корпоративный сайт, digital-стратегия.
• От 120 000 ₽: индивидуальные решения или интернет-магазин.
Напишите нишу, цель сайта и желаемый срок — дам 2-3 точных варианта с ценой.`,
      handoff: false,
    };
  }

  const budgetMatch = text.match(/до\s*(\d[\d\s]*)/);
  if (budgetMatch?.[1]) {
    const budgetValue = Number.parseInt(budgetMatch[1].replace(/\s+/g, ''), 10);
    if (!Number.isNaN(budgetValue)) {
      const recommended = DEVELOPMENT_OFFERS.filter((offer) => {
        const priceMatch = offer.price.match(/(\d[\d\s]*)/);
        if (!priceMatch) return false;
        const minPrice = Number.parseInt(priceMatch[1].replace(/\s+/g, ''), 10);
        return !Number.isNaN(minPrice) && minPrice <= budgetValue;
      }).slice(0, 4);

      if (recommended.length > 0) {
        return {
          reply: `При бюджете до ${budgetValue.toLocaleString('ru-RU')} ₽ подойдут:
${formatOffers(recommended)}
Если хотите, сузим выбор по цели: заявки, имидж, продажи или SEO-трафик.`,
          handoff: false,
        };
      }
    }
  }

  if (/цен|стоим|бюджет|прайс|сколько/.test(text)) {
    return {
      reply: pickVariant(
        [
          `По ценам ориентир такой:
• Готовые сайты: от 24 900 ₽.
• Сайт-визитка: от 29 900 ₽, лендинг: от 44 900 ₽.
• Корпоративный сайт: от 79 900 ₽, интернет-магазин: от 149 000 ₽.
Итог зависит от объёма страниц, интеграций и требуемой скорости запуска.`,
          `Ориентиры по бюджету:
• До 50 000 ₽: готовые сайты и визитки.
• 50 000–120 000 ₽: лендинги, корпоративные сайты, digital-стратегия.
• От 120 000 ₽: кастом и e-commerce.
Если дадите цель и бюджет, соберу более точный расчёт.`,
          `Можно считать по этапам: дизайн, верстка, интеграции, контент, SEO-структура.
Базовые цены начинаются от 24 900 ₽, а сложные решения — от 120 000 ₽.
Напишите задачу, и я предложу 2-3 формата с разным бюджетом.`,
        ],
        seed,
      ),
      handoff: false,
    };
  }

  if (/срок|дедлайн|когда|как быстро/.test(text)) {
    return {
      reply: pickVariant(
        [
          `Обычно по срокам:
• Готовые сайты: 3-7 дней.
• Визитка: 7-12 дней, лендинг: 10-14 дней.
• Корпоративный сайт: 3-6 недель, интернет-магазин: 6-10 недель.
Точный срок зависит от контента, правок и количества интеграций.`,
          `Если нужен быстрый старт, можем собрать решение за 3-14 дней (готовый сайт, визитка или лендинг).
Средние проекты обычно укладываются в 3-6 недель.
Сложные кастомные продукты и e-commerce требуют от 1.5 месяцев.`,
          `Чтобы уложиться в дедлайн, на старте фиксируем: структуру, контент и список функционала.
Это сокращает число правок и ускоряет запуск.
Пришлите желаемую дату запуска — предложу реальный план по этапам.`,
        ],
        seed,
      ),
      handoff: false,
    };
  }

  if (/seo|яндекс|google|топ.?10/.test(text)) {
    return {
      reply: pickVariant(
        [
          `SEO-направления:
${formatOffers(SEO_OFFERS)}
В каждом пакете: аудит, сбор семантики, техоптимизация и регулярная отчётность.`,
          `Если рынок конкурентный, обычно эффективнее стартовать с пакета «Комплексное SEO» (от 55 000 ₽/мес).
Для локальных задач можно начать с Яндекса от 35 000 ₽/мес.
Подскажите нишу — подберу стратегию и приоритеты.`,
          `Для быстрого эффекта начинаем с техаудита и исправления критичных ошибок, затем усиливаем контент и структуру.
Бюджет на старте: от 35 000 ₽/мес.
Могу расписать, что делаем в первый месяц по шагам.`,
        ],
        seed,
      ),
      handoff: false,
    };
  }

  if (/бренд|айдентик|логотип|нейминг|tone|позиционирован/.test(text)) {
    return {
      reply: pickVariant(
        [
          `По брендингу можем закрыть весь цикл:
${formatOffers(BRANDING_OFFERS)}
Если проект с нуля, оптимально начинать со стратегии бренда и вербальной идентичности.`,
          `Для старта бренда обычно достаточно 2 этапов: стратегия + визуальная идентичность.
Для масштабирования добавляем брендбук и коммуникации.
Скажу точный состав после понимания вашей ниши и целевой аудитории.`,
          `Если цель — повысить узнаваемость, делаем связку:
1) позиционирование и УТП,
2) визуал и Tone of Voice,
3) коммуникационная система для рекламы и соцсетей.`,
        ],
        seed,
      ),
      handoff: false,
    };
  }

  if (/разработк|сайт|лендинг|визитк|корпоратив|магазин|digital/.test(text)) {
    return {
      reply: `По разработке доступны форматы:
${formatOffers(DEVELOPMENT_OFFERS)}
Если напишете цель проекта и примерный бюджет, подберу самый выгодный вариант.`,
      handoff: false,
    };
  }

  if (/как заказать|заказ|начать|оставить заявку|связаться/.test(text)) {
    return {
      reply: pickVariant(
        [
          `Как начать:
1) Выберите услугу в разделе «Услуги».
2) Нажмите «Заказать» и заполните форму «Готовы начать проект?».
3) Укажите цель, срок и бюджет — команда подготовит предложение.
Альтернатива: сразу пишите в Telegram ${TELEGRAM_SUPPORT_HANDLE}.`,
          `Для быстрого старта отправьте 4 пункта: ниша, задача, желаемый срок, бюджет.
Дальше команда предложит 2-3 формата решения и дорожную карту.
Заявку можно оставить через форму контактов или в Telegram ${TELEGRAM_SUPPORT_HANDLE}.`,
          `Если хотите, можем пройти экспресс-бриф прямо здесь:
• Что нужно сделать?
• К какому сроку?
• Какой бюджет рассматриваете?
После этого дам точный ориентир по формату работ.`,
        ],
        seed,
      ),
      handoff: false,
    };
  }

  if (/акци|скидк|спец/.test(text)) {
    return {
      reply: pickVariant(
        [
          `Сейчас доступны акции:
${formatOffers(PROMO_OFFERS)}
Если опишете задачу, подскажу, где максимальная выгода.`,
          `В разделе «Акции» есть готовые пакетные решения для быстрого старта.
Чаще всего для нового бизнеса выбирают «Старт бизнеса», для действующих сайтов — «Редизайн сайта».`,
          `Могу подобрать акцию под ваш сценарий:
• запуск с нуля,
• усиление текущего сайта,
• SEO и контент-план на 90 дней.`,
        ],
        seed,
      ),
      handoff: false,
    };
  }

  if (/погод|курс валют|доллар|биткоин|гороскоп|фильм|игр|политик|рецепт/.test(text)) {
    return {
      reply: `Этот вопрос не относится к услугам DualStack. Для нестандартных запросов лучше написать в Telegram ${TELEGRAM_SUPPORT_HANDLE}.`,
      handoff: true,
    };
  }

  return {
    reply: buildClarifyingPrompt(history, question),
    handoff: false,
  };
}

async function askGpt(messages: ChatMessage[]): Promise<GptSupportResponse> {
  const question = messages[messages.length - 1]?.text ?? '';

  const recentAssistantReplies = messages
    .filter((item) => item.role === 'assistant')
    .slice(-3)
    .map((item, index) => `${index + 1}. ${item.text}`)
    .join('\n');

  const apiMessages = [
    { role: 'system', content: GPT_SYSTEM_PROMPT },
    { role: 'system', content: `База знаний DualStack:\n${SUPPORT_KNOWLEDGE}` },
    {
      role: 'system',
      content:
        recentAssistantReplies.length > 0
          ? `Недавние ответы ассистента (избегай повторять их дословно):\n${recentAssistantReplies}`
          : 'Пока нет предыдущих ответов ассистента.',
    },
    ...messages.slice(-14).map((message) => ({
      role: message.role,
      content: message.text,
    })),
  ];

  if (GPT_MODE === 'fallback') {
    return buildLocalSupportAnswer(question, messages);
  }

  const payload = {
    model: OPENAI_MODEL,
    temperature: 0.45,
    frequency_penalty: 0.7,
    presence_penalty: 0.45,
    max_tokens: 420,
    response_format: { type: 'json_object' as const },
    messages: apiMessages,
  };

  try {
    const response =
      GPT_MODE === 'proxy'
        ? await fetch(OPENAI_PROXY_URL, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(payload),
          })
        : await fetch(OPENAI_API_URL, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${OPENAI_API_KEY}`,
            },
            body: JSON.stringify(payload),
          });

    if (!response.ok) {
      return buildLocalSupportAnswer(question, messages);
    }

    const rawData = (await response.json()) as
      | GptSupportResponse
      | {
          choices?: Array<{
            message?: {
              content?: string;
            };
          }>;
        };

    if (
      typeof (rawData as GptSupportResponse).reply === 'string' &&
      typeof (rawData as GptSupportResponse).handoff === 'boolean'
    ) {
      const direct = rawData as GptSupportResponse;
      return {
        reply: diversifyReply(direct.reply, direct.handoff, question, messages),
        handoff: direct.handoff,
      };
    }

    const content = (rawData as { choices?: Array<{ message?: { content?: string } }> }).choices?.[0]?.message?.content ?? '';
    const parsed = parseGptResponse(content);
    return {
      reply: diversifyReply(parsed.reply, parsed.handoff, question, messages),
      handoff: parsed.handoff,
    };
  } catch {
    return buildLocalSupportAnswer(question, messages);
  }
}

export function SupportChatWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: createId(),
      role: 'assistant',
      text: 'Привет! Я умный ассистент техподдержки DualStack. Могу ответить по услугам, ценам, срокам и запуску проекта.',
    },
  ]);
  const listRef = useRef<HTMLDivElement | null>(null);

  const gptStatusText =
    GPT_MODE === 'proxy'
      ? 'GPT через защищённый сервер'
      : GPT_MODE === 'direct'
        ? 'GPT OpenAI подключён'
        : 'Локальный умный fallback + Telegram';

  const scrollToBottom = () => {
    if (listRef.current) {
      listRef.current.scrollTop = listRef.current.scrollHeight;
    }
  };

  const handleSend = async (rawText?: string) => {
    const text = (rawText ?? input).trim();
    if (!text || isLoading) return;

    const userMessage: ChatMessage = { id: createId(), role: 'user', text };
    const nextMessages = [...messages, userMessage];

    setMessages(nextMessages);
    setInput('');
    setIsLoading(true);
    requestAnimationFrame(scrollToBottom);

    try {
      const gptReply = await askGpt(nextMessages);
      setMessages((prev) => [
        ...prev,
        {
          id: createId(),
          role: 'assistant',
          text: gptReply.reply,
          handoff: gptReply.handoff,
        },
      ]);
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          id: createId(),
          role: 'assistant',
          text: `Сейчас не удалось обработать запрос. Переключаю на техподдержку в Telegram ${TELEGRAM_SUPPORT_HANDLE}.`,
          handoff: true,
        },
      ]);
    } finally {
      setIsLoading(false);
      requestAnimationFrame(scrollToBottom);
    }
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    void handleSend();
  };

  return (
    <div className="fixed bottom-4 right-4 z-40">
      <AnimatePresence mode="wait">
        {isOpen ? (
          <motion.div
            key="chat-open"
            initial={{ opacity: 0, y: 24, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 16, scale: 0.96 }}
            transition={{ duration: 0.22 }}
            className="w-[min(92vw,360px)] overflow-hidden rounded-2xl border border-white/12 bg-black/92 shadow-2xl shadow-black/60"
          >
            <div className="flex items-center justify-between border-b border-white/10 bg-gradient-to-r from-blue-600/30 to-purple-600/30 px-4 py-3">
              <div className="flex items-center gap-2">
                <Bot className="h-5 w-5 text-cyan-300" />
                <div>
                  <p className="text-sm font-semibold text-white">Тех. поддержка GPT</p>
                  <p className="text-[11px] text-white/65">{gptStatusText}</p>
                </div>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="rounded-lg p-1.5 text-white/75 transition-colors hover:bg-white/10 hover:text-white"
                aria-label="Закрыть чат"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div ref={listRef} className="max-h-[360px] space-y-3 overflow-y-auto px-3 py-3">
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={`max-w-[92%] rounded-xl px-3 py-2 text-sm leading-relaxed ${
                    message.role === 'assistant'
                      ? 'border border-white/10 bg-white/6 text-white/85'
                      : 'ml-auto bg-gradient-to-r from-blue-600 to-purple-600 text-white'
                  }`}
                >
                  {message.text}
                  {message.handoff && (
                    <a
                      href={TELEGRAM_SUPPORT_URL}
                      target="_blank"
                      rel="noreferrer"
                      className="mt-2 inline-flex items-center gap-1 rounded-lg border border-cyan-300/40 bg-cyan-400/10 px-2 py-1 text-xs text-cyan-200 hover:bg-cyan-400/20"
                    >
                      Написать в Telegram
                      <ExternalLink className="h-3 w-3" />
                    </a>
                  )}
                </div>
              ))}

              {isLoading && (
                <div className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/6 px-3 py-2 text-sm text-white/75">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Думаю над ответом...
                </div>
              )}
            </div>

            <div className="border-t border-white/10 px-3 py-3">
              <div className="mb-2 flex flex-wrap gap-2">
                {QUICK_QUESTIONS.map((question) => (
                  <button
                    key={question}
                    onClick={() => void handleSend(question)}
                    className="rounded-full border border-white/15 px-2.5 py-1 text-xs text-white/70 transition-colors hover:border-white/30 hover:text-white"
                    type="button"
                    disabled={isLoading}
                  >
                    {question}
                  </button>
                ))}
              </div>

              <form onSubmit={handleSubmit} className="flex items-center gap-2">
                <input
                  value={input}
                  onChange={(event) => setInput(event.target.value)}
                  placeholder="Введите вопрос..."
                  className="h-10 w-full rounded-xl border border-white/12 bg-white/6 px-3 text-sm text-white placeholder:text-white/35 focus:outline-none focus:border-cyan-400/60"
                />
                <button
                  type="submit"
                  disabled={isLoading || !input.trim()}
                  className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-r from-blue-600 to-purple-600 text-white disabled:opacity-50"
                  aria-label="Отправить"
                >
                  <Send className="h-4 w-4" />
                </button>
              </form>
            </div>
          </motion.div>
        ) : (
          <motion.button
            key="chat-closed"
            initial={{ opacity: 0, y: 12, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            onClick={() => setIsOpen(true)}
            className="group flex items-center gap-2 rounded-full border border-white/12 bg-black/85 px-3 py-2 text-white shadow-xl shadow-black/50 md:backdrop-blur-sm"
          >
            <span className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-r from-blue-600 to-purple-600">
              <MessageCircle className="h-5 w-5" />
            </span>
            <span className="pr-1 text-sm text-white/90">Тех. поддержка</span>
          </motion.button>
        )}
      </AnimatePresence>
    </div>
  );
}
