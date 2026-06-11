export const PORTAL_STORAGE_KEY = 'dualstack.client.portal.store';
const PORTAL_SHARED_MIGRATION_KEY = 'dualstack.client.portal.shared.migrated';
const PORTAL_SHARED_STORE_ENDPOINT = '/auth/portal-store.php';
export const ADMIN_EMAIL = 'Aleshashin@icloud.com';
export const ADMIN_PASSWORD = 'AleshA08';

export type AuthMode = 'login' | 'register';
export type LoginMethod = 'email' | 'phone';
export type PortalRole = 'client' | 'admin';
export type ProjectStatus =
  | 'Новый запрос'
  | 'В брифе'
  | 'В работе'
  | 'На согласовании'
  | 'Запущен';

export interface PortalUser {
  id: string;
  name: string;
  email: string;
  phone?: string;
  company?: string;
  role: PortalRole;
}

export interface ClientProject {
  id: string;
  name: string;
  service: string;
  status: ProjectStatus;
  progress: number;
  deadline: string;
  budget: string;
  brief: string;
  updatedAt: string;
  unreadCount: number;
  managerName: string;
  nextStep: string;
  nextMeeting: string;
}

export type PortalMessageAuthor = 'client' | 'manager' | 'system';

export interface PortalMessage {
  id: string;
  projectId: string;
  author: PortalMessageAuthor;
  authorName: string;
  text: string;
  createdAt: string;
  replyToMessageId?: string;
  replyToText?: string;
  replyToAuthorName?: string;
  editedAt?: string;
  editedByName?: string;
}

export interface ComposePortalMessageInput {
  text: string;
  replyToMessage?: PortalMessage | null;
}

export interface PortalSession {
  user: PortalUser;
  projects: ClientProject[];
  messages: PortalMessage[];
  createdAt: string;
  updatedAt?: string;
  authPassword?: string;
  leadGoal?: string;
}

export interface PortalStore {
  currentUser: PortalUser | null;
  clients: PortalSession[];
  deletedClientIds?: string[];
  deletedProjectIds?: string[];
  deletedMessageIds?: string[];
}

export interface CreateProjectInput {
  name: string;
  service: string;
  deadline: string;
  budget: string;
  brief: string;
}

export interface AuthSuccessPayload {
  mode: AuthMode;
  role: PortalRole;
  loginMethod?: LoginMethod;
  user: {
    name?: string;
    email: string;
    phone?: string;
    password?: string;
  };
  leadGoal?: string;
}

const MANAGER_POOL = ['Анна Соколова', 'Даниил Власов', 'Мария Лебедева', 'Никита Орлов'];
const SERVICE_POOL = ['Разработка сайта', 'SEO продвижение', 'Брендинг', 'Поддержка проекта'];

function offsetDate(days: number) {
  const date = new Date();
  date.setDate(date.getDate() + days);
  return date.toISOString();
}

export function createPortalId(prefix = 'portal') {
  return `${prefix}-${Math.random().toString(36).slice(2, 10)}`;
}

function pickManager(seed: string) {
  const hash = [...seed].reduce((acc, symbol) => acc + symbol.charCodeAt(0), 0);
  return MANAGER_POOL[hash % MANAGER_POOL.length];
}

function createAdminUser(): PortalUser {
  return {
    id: 'admin-root',
    name: 'Админ DualStack',
    email: ADMIN_EMAIL,
    role: 'admin',
  };
}

export function createEmptyPortalStore(): PortalStore {
  return {
    currentUser: null,
    clients: [],
    deletedClientIds: [],
    deletedProjectIds: [],
    deletedMessageIds: [],
  };
}

export function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}

export function normalizePhone(phone?: string) {
  return (phone ?? '').replace(/[^\d+]/g, '');
}

function buildPhoneDisplayName(phone?: string) {
  const normalized = normalizePhone(phone);
  if (!normalized) return 'Клиент DualStack';
  return `Клиент ${normalized.slice(-4)}`;
}

export function inferNameFromEmail(email: string) {
  const localPart = email.split('@')[0]?.trim();
  if (!localPart) return 'Клиент DualStack';

  return localPart
    .replace(/[._-]+/g, ' ')
    .split(' ')
    .filter(Boolean)
    .map((chunk) => chunk[0]?.toUpperCase() + chunk.slice(1))
    .join(' ');
}

export function isAdminCredentials(email: string, password: string) {
  return normalizeEmail(email) === normalizeEmail(ADMIN_EMAIL) && password === ADMIN_PASSWORD;
}

export function formatPortalDate(value: string, options?: Intl.DateTimeFormatOptions) {
  return new Intl.DateTimeFormat('ru-RU', {
    day: 'numeric',
    month: 'long',
    ...options,
  }).format(new Date(value));
}

function makeProject(
  overrides: Partial<ClientProject> & Pick<ClientProject, 'name' | 'service' | 'status'>,
): ClientProject {
  const id = overrides.id ?? createPortalId('project');
  const managerName = overrides.managerName ?? pickManager(`${overrides.name}-${overrides.service}`);

  return {
    id,
    name: overrides.name,
    service: overrides.service,
    status: overrides.status,
    progress: overrides.progress ?? 18,
    deadline: overrides.deadline ?? offsetDate(12),
    budget: overrides.budget ?? 'обсуждается',
    brief: overrides.brief ?? 'Подробности проекта появятся после первого созвона и брифа.',
    updatedAt: overrides.updatedAt ?? new Date().toISOString(),
    unreadCount: overrides.unreadCount ?? 0,
    managerName,
    nextStep: overrides.nextStep ?? 'Согласовать следующий этап с менеджером',
    nextMeeting: overrides.nextMeeting ?? offsetDate(2),
  };
}

export function createProjectFromInput(input: CreateProjectInput) {
  return makeProject({
    name: input.name.trim(),
    service: input.service.trim() || SERVICE_POOL[0],
    status: 'Новый запрос',
    progress: 0,
    deadline: input.deadline || offsetDate(7),
    budget: input.budget.trim() || 'уточняется',
    brief: input.brief.trim() || 'Клиент создал проект через личный кабинет.',
    unreadCount: 0,
    nextStep: 'Провести стартовый созвон и утвердить рамки проекта',
    nextMeeting: offsetDate(1),
    updatedAt: new Date().toISOString(),
  });
}

function createSeedProjects(user: PortalUser, leadGoal?: string) {
  const leadProject = leadGoal
    ? makeProject({
        name: `Новый запрос: ${leadGoal.slice(0, 36)}${leadGoal.length > 36 ? '...' : ''}`,
        service: SERVICE_POOL[0],
        status: 'Новый запрос',
        progress: 12,
        deadline: offsetDate(5),
        budget: 'после оценки',
        brief: leadGoal,
        unreadCount: 0,
        nextStep: 'Уточнить бриф и подготовить оценку объёма работ',
        nextMeeting: offsetDate(1),
        updatedAt: new Date().toISOString(),
      })
    : null;

  const defaultProjects = [
    makeProject({
      name: `${user.name.split(' ')[0] || 'Клиент'}: редизайн главной страницы`,
      service: 'Разработка сайта',
      status: 'В работе',
      progress: 68,
      deadline: offsetDate(9),
      budget: '84 000 ₽',
      brief: 'Обновить первый экран, структуру преимуществ и усилить конверсию формы заявки.',
      unreadCount: 1,
      nextStep: 'Согласовать интерактивный прототип и тексты для hero-блока',
      nextMeeting: offsetDate(2),
      updatedAt: offsetDate(0),
    }),
    makeProject({
      name: 'SEO-спринт на 30 дней',
      service: 'SEO продвижение',
      status: 'На согласовании',
      progress: 83,
      deadline: offsetDate(13),
      budget: '40 000 ₽/мес',
      brief: 'Исправление техошибок, расширение структуры и запуск контентного плана.',
      unreadCount: 1,
      nextStep: 'Утвердить список приоритетных ключевых страниц',
      nextMeeting: offsetDate(3),
      updatedAt: offsetDate(-1),
    }),
    makeProject({
      name: 'Айдентика для нового продукта',
      service: 'Брендинг',
      status: 'В брифе',
      progress: 24,
      deadline: offsetDate(18),
      budget: '95 000 ₽',
      brief: 'Нужна визуальная система для запуска нового продукта и презентации для партнёров.',
      unreadCount: 0,
      nextStep: 'Собрать moodboard и определить визуальные ориентиры',
      nextMeeting: offsetDate(4),
      updatedAt: offsetDate(-2),
    }),
  ];

  return leadProject ? [leadProject, ...defaultProjects] : defaultProjects;
}

function createSeedMessages(projects: ClientProject[], user: PortalUser) {
  return projects.flatMap<PortalMessage>((project, index) => {
    const commonCreatedAt = new Date(Date.now() - (index + 1) * 60 * 60 * 1000).toISOString();

    return [
      {
        id: createPortalId('message'),
        projectId: project.id,
        author: 'manager',
        authorName: project.managerName,
        text: `${user.name}, проект "${project.name}" уже в кабинете. Держу на контроле ближайший шаг: ${project.nextStep.toLowerCase()}.`,
        createdAt: commonCreatedAt,
      },
      {
        id: createPortalId('message'),
        projectId: project.id,
        author: 'system',
        authorName: 'DualStack',
        text: `Дедлайн проекта запланирован на ${formatPortalDate(project.deadline)}.`,
        createdAt: new Date(Date.now() - (index + 1) * 45 * 60 * 1000).toISOString(),
      },
    ];
  });
}

export function createPortalSession(
  user: PortalUser,
  options?: {
    leadGoal?: string;
    password?: string;
    withSeedProjects?: boolean;
  },
): PortalSession {
  const leadGoal = options?.leadGoal?.trim();
  const withSeedProjects = options?.withSeedProjects ?? false;
  const normalizedUser: PortalUser = {
    ...user,
    name:
      user.name.trim() ||
      inferNameFromEmail(user.email) ||
      buildPhoneDisplayName(user.phone),
    email: normalizeEmail(user.email),
    phone: normalizePhone(user.phone),
    company: user.company?.trim(),
    role: 'client',
  };

  const projects = withSeedProjects ? createSeedProjects(normalizedUser, leadGoal) : [];

  return {
    user: normalizedUser,
    projects,
    messages: withSeedProjects ? createSeedMessages(projects, normalizedUser) : [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    authPassword: options?.password?.trim() || undefined,
    leadGoal,
  };
}

export function createMessagesForProject(project: ClientProject, user: PortalUser) {
  return [
    {
      id: createPortalId('message'),
      projectId: project.id,
      author: 'system' as const,
      authorName: 'DualStack',
      text: `Проект "${project.name}" создан в кабинете. Стартовый дедлайн: ${formatPortalDate(project.deadline)}.`,
      createdAt: new Date().toISOString(),
    },
    {
      id: createPortalId('message'),
      projectId: project.id,
      author: 'manager' as const,
      authorName: project.managerName,
      text: `${user.name}, получил новый запрос. Сегодня соберу вводные и предложу ближайший план работ.`,
      createdAt: new Date().toISOString(),
    },
  ];
}

const REPLY_PREVIEW_LIMIT = 180;

export function createReplySnapshot(message: PortalMessage) {
  const normalizedText = message.text.trim();
  const preview =
    normalizedText.length <= REPLY_PREVIEW_LIMIT
      ? normalizedText
      : `${normalizedText.slice(0, REPLY_PREVIEW_LIMIT - 1)}…`;

  return {
    replyToMessageId: message.id,
    replyToText: preview,
    replyToAuthorName: message.authorName,
  };
}

export function buildManagerReply(project: ClientProject, text: string) {
  const normalized = text.toLowerCase();

  if (/созвон|встреч|колл|связ/i.test(normalized)) {
    return `По "${project.name}" могу поставить созвон на ${formatPortalDate(project.nextMeeting)} в первой половине дня. Если подходит, подтвержу слот и добавлю его в таймлайн проекта.`;
  }

  if (/срок|дедлайн|успева|когда/i.test(normalized)) {
    return `По срокам держим ориентир на ${formatPortalDate(project.deadline)}. Сейчас фокус на этапе "${project.status}", а ближайший шаг у нас такой: ${project.nextStep.toLowerCase()}.`;
  }

  if (/статус|что с проектом|как дела/i.test(normalized)) {
    return `Актуальный статус проекта "${project.name}" — "${project.status}". Готовность уже ${project.progress}%, а следующий контрольный шаг: ${project.nextStep.toLowerCase()}.`;
  }

  if (/файл|материал|контент|логотип|доступ/i.test(normalized)) {
    return `Материалы по "${project.name}" беру в работу. Как только всё проверю, отмечу это в кабинете и отпишусь отдельным сообщением.`;
  }

  if (/смет|бюджет|стоим/i.test(normalized)) {
    return `По проекту "${project.name}" ориентир бюджета сейчас ${project.budget}. Если добавим новый функционал, я сначала пришлю обновлённую оценку и только потом двинемся дальше.`;
  }

  return `Принял сообщение по проекту "${project.name}". Зафиксировал запрос и вернусь с апдейтом после ближайшей проверки задач.`;
}

function sanitizePortalSession(value: unknown): PortalSession | null {
  if (!value || typeof value !== 'object') return null;

  const candidate = value as Partial<PortalSession>;
  if (!candidate.user || !candidate.projects || !candidate.messages) return null;
  if (!Array.isArray(candidate.projects) || !Array.isArray(candidate.messages)) return null;
  if (typeof candidate.user.name !== 'string') return null;

  const sanitizedMessages = candidate.messages
    .map((message) => sanitizePortalMessage(message))
    .filter((message): message is PortalMessage => Boolean(message));

  return {
    user: {
      ...candidate.user,
      id: candidate.user.id || createPortalId('user'),
      email: candidate.user.email || '',
      role: 'client',
    } as PortalUser,
    projects: candidate.projects as ClientProject[],
    messages: sanitizedMessages,
    createdAt: candidate.createdAt || new Date().toISOString(),
    updatedAt: typeof candidate.updatedAt === 'string' ? candidate.updatedAt : undefined,
    authPassword: typeof candidate.authPassword === 'string' ? candidate.authPassword : undefined,
    leadGoal: typeof candidate.leadGoal === 'string' ? candidate.leadGoal : undefined,
  };
}

function sanitizeDeletedIds(value: unknown) {
  if (!Array.isArray(value)) return [];

  return Array.from(
    new Set(value.filter((item): item is string => typeof item === 'string' && item.trim() !== '')),
  );
}

function getPortalStoreDeletedIds(store: PortalStore) {
  return {
    deletedClientIds: sanitizeDeletedIds(store.deletedClientIds),
    deletedProjectIds: sanitizeDeletedIds(store.deletedProjectIds),
    deletedMessageIds: sanitizeDeletedIds(store.deletedMessageIds),
  };
}

function mergePortalStoreDeletedIds(left: PortalStore, right: PortalStore) {
  return {
    deletedClientIds: sanitizeDeletedIds([
      ...(left.deletedClientIds ?? []),
      ...(right.deletedClientIds ?? []),
    ]),
    deletedProjectIds: sanitizeDeletedIds([
      ...(left.deletedProjectIds ?? []),
      ...(right.deletedProjectIds ?? []),
    ]),
    deletedMessageIds: sanitizeDeletedIds([
      ...(left.deletedMessageIds ?? []),
      ...(right.deletedMessageIds ?? []),
    ]),
  };
}

function filterDeletedPortalEntities(store: PortalStore): PortalStore {
  const deletedClientIds = new Set(store.deletedClientIds ?? []);
  const deletedProjectIds = new Set(store.deletedProjectIds ?? []);
  const deletedMessageIds = new Set(store.deletedMessageIds ?? []);
  const clients = store.clients
    .filter((client) => !deletedClientIds.has(client.user.id))
    .map((client) => ({
      ...client,
      projects: client.projects.filter((project) => !deletedProjectIds.has(project.id)),
      messages: client.messages.filter((message) => !deletedMessageIds.has(message.id)),
    }));

  return {
    ...store,
    clients,
    currentUser: reconcileCurrentUser(store.currentUser, clients),
    ...getPortalStoreDeletedIds(store),
  };
}

function sanitizePortalMessage(value: unknown): PortalMessage | null {
  if (!value || typeof value !== 'object') return null;

  const candidate = value as Partial<PortalMessage>;
  if (
    typeof candidate.id !== 'string' ||
    typeof candidate.projectId !== 'string' ||
    typeof candidate.author !== 'string' ||
    typeof candidate.authorName !== 'string' ||
    typeof candidate.text !== 'string'
  ) {
    return null;
  }

  if (
    candidate.author !== 'client' &&
    candidate.author !== 'manager' &&
    candidate.author !== 'system'
  ) {
    return null;
  }

  return {
    id: candidate.id,
    projectId: candidate.projectId,
    author: candidate.author,
    authorName: candidate.authorName,
    text: candidate.text,
    createdAt:
      typeof candidate.createdAt === 'string' ? candidate.createdAt : new Date().toISOString(),
    replyToMessageId:
      typeof candidate.replyToMessageId === 'string' ? candidate.replyToMessageId : undefined,
    replyToText: typeof candidate.replyToText === 'string' ? candidate.replyToText : undefined,
    replyToAuthorName:
      typeof candidate.replyToAuthorName === 'string' ? candidate.replyToAuthorName : undefined,
    editedAt: typeof candidate.editedAt === 'string' ? candidate.editedAt : undefined,
    editedByName: typeof candidate.editedByName === 'string' ? candidate.editedByName : undefined,
  };
}

function sanitizePortalStore(value: unknown): PortalStore | null {
  if (!value || typeof value !== 'object') return null;

  const candidate = value as Partial<PortalStore>;

  if (Array.isArray((candidate as Partial<PortalSession>).projects)) {
    const migratedClient = sanitizePortalSession(candidate);
    if (!migratedClient) return null;

    return filterDeletedPortalEntities({
      currentUser: migratedClient.user,
      clients: [migratedClient],
      deletedClientIds: [],
      deletedProjectIds: [],
      deletedMessageIds: [],
    });
  }

  if (!Array.isArray(candidate.clients)) return null;

  return filterDeletedPortalEntities({
    currentUser:
      candidate.currentUser && typeof candidate.currentUser === 'object'
        ? {
            ...(candidate.currentUser as PortalUser),
            id: (candidate.currentUser as PortalUser).id || createPortalId('user'),
            role: (candidate.currentUser as PortalUser).role || 'client',
            email: (candidate.currentUser as PortalUser).email || '',
          }
        : null,
    clients: candidate.clients
      .map((client) => sanitizePortalSession(client))
      .filter((client): client is PortalSession => Boolean(client)),
    deletedClientIds: sanitizeDeletedIds(candidate.deletedClientIds),
    deletedProjectIds: sanitizeDeletedIds(candidate.deletedProjectIds),
    deletedMessageIds: sanitizeDeletedIds(candidate.deletedMessageIds),
  });
}

export function loadPortalStore() {
  if (typeof window === 'undefined') return createEmptyPortalStore();

  try {
    const raw = window.localStorage.getItem(PORTAL_STORAGE_KEY);
    if (!raw) return createEmptyPortalStore();

    return sanitizePortalStore(JSON.parse(raw)) ?? createEmptyPortalStore();
  } catch {
    return createEmptyPortalStore();
  }
}

export function savePortalStore(store: PortalStore) {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(PORTAL_STORAGE_KEY, JSON.stringify(store));
}

function getClientUpdatedTimestamp(session: PortalSession) {
  const timestamps = [
    session.createdAt,
    session.updatedAt,
    ...session.projects.map((project) => project.updatedAt),
    ...session.messages.flatMap((message) => [message.createdAt, message.editedAt]),
  ]
    .filter((value): value is string => Boolean(value))
    .map((value) => new Date(value).getTime())
    .filter(Number.isFinite);

  return Math.max(0, ...timestamps);
}

function findMatchingClientIndex(clients: PortalSession[], session: PortalSession) {
  const sessionEmail = normalizeEmail(session.user.email);
  const sessionPhone = normalizePhone(session.user.phone);

  return clients.findIndex((client) => {
    const sameId = client.user.id && client.user.id === session.user.id;
    const sameEmail = sessionEmail && normalizeEmail(client.user.email) === sessionEmail;
    const samePhone = sessionPhone && normalizePhone(client.user.phone) === sessionPhone;

    return sameId || sameEmail || samePhone;
  });
}

function reconcileCurrentUser(
  currentUser: PortalUser | null,
  clients: PortalSession[],
) {
  if (!currentUser) return null;
  if (currentUser.role === 'admin') return currentUser;

  const currentSession = createPortalSession(currentUser);
  const matchingClientIndex = findMatchingClientIndex(clients, currentSession);

  return matchingClientIndex >= 0 ? clients[matchingClientIndex].user : null;
}

export function hasMigratedSharedPortalStore() {
  if (typeof window === 'undefined') return true;
  return window.localStorage.getItem(PORTAL_SHARED_MIGRATION_KEY) === '1';
}

export function markSharedPortalStoreMigrated() {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(PORTAL_SHARED_MIGRATION_KEY, '1');
}

export function mergePortalStoresForSharedMigration(
  localStore: PortalStore,
  sharedStore: PortalStore,
): PortalStore {
  const clients = [...sharedStore.clients];

  localStore.clients.forEach((localClient) => {
    const matchingClientIndex = findMatchingClientIndex(clients, localClient);

    if (matchingClientIndex < 0) {
      clients.push(localClient);
      return;
    }

    const sharedClient = clients[matchingClientIndex];
    if (getClientUpdatedTimestamp(localClient) > getClientUpdatedTimestamp(sharedClient)) {
      clients[matchingClientIndex] = localClient;
    }
  });

  return {
    ...filterDeletedPortalEntities({
      currentUser: reconcileCurrentUser(localStore.currentUser, clients),
      clients,
      ...mergePortalStoreDeletedIds(localStore, sharedStore),
    }),
  };
}

export function applySharedPortalStore(
  localStore: PortalStore,
  sharedStore: PortalStore,
): PortalStore {
  const deletedIds = mergePortalStoreDeletedIds(localStore, sharedStore);
  const nextStore = filterDeletedPortalEntities({
    currentUser: reconcileCurrentUser(localStore.currentUser, sharedStore.clients),
    clients: sharedStore.clients,
    ...deletedIds,
  });

  return nextStore;
}

export function arePortalStoresEqual(left: PortalStore, right: PortalStore) {
  return JSON.stringify(left) === JSON.stringify(right);
}

async function parseSharedPortalStoreResponse(response: Response) {
  try {
    const raw = await response.text();
    const payload = JSON.parse(raw || '{}');
    const candidate = payload?.store ?? payload;
    return sanitizePortalStore(candidate) ?? createEmptyPortalStore();
  } catch {
    return null;
  }
}

export async function loadSharedPortalStore() {
  if (typeof window === 'undefined') return null;

  try {
    const response = await fetch(PORTAL_SHARED_STORE_ENDPOINT, {
      method: 'GET',
      headers: {
        Accept: 'application/json',
      },
      cache: 'no-store',
    });

    if (!response.ok) return null;

    return await parseSharedPortalStoreResponse(response);
  } catch {
    return null;
  }
}

export async function saveSharedPortalStore(store: PortalStore) {
  if (typeof window === 'undefined') return false;

  try {
    const response = await fetch(PORTAL_SHARED_STORE_ENDPOINT, {
      // Shared hosting setups are far more consistent with POST than PUT.
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: JSON.stringify({
        store: {
          currentUser: null,
          clients: store.clients,
          ...getPortalStoreDeletedIds(store),
        },
      }),
    });

    if (!response.ok) return false;

    const raw = await response.text();
    const payload = JSON.parse(raw || '{}') as { ok?: unknown };

    return payload.ok === true;
  } catch {
    return false;
  }
}

export async function loadSyncedPortalStore() {
  const localStore = loadPortalStore();
  const sharedStore = await loadSharedPortalStore();

  if (!sharedStore) {
    return localStore;
  }

  const nextStore = hasMigratedSharedPortalStore()
    ? applySharedPortalStore(localStore, sharedStore)
    : mergePortalStoresForSharedMigration(localStore, sharedStore);

  savePortalStore(nextStore);

  if (!hasMigratedSharedPortalStore()) {
    markSharedPortalStoreMigrated();
    void saveSharedPortalStore(nextStore);
  }

  return nextStore;
}

export function getActiveClientSession(store: PortalStore) {
  if (!store.currentUser || store.currentUser.role !== 'client') return null;
  return store.clients.find((client) => client.user.id === store.currentUser?.id) ?? null;
}

export function getClientSessionById(store: PortalStore, clientId: string | null) {
  if (!clientId) return null;
  return store.clients.find((client) => client.user.id === clientId) ?? null;
}

export function clearCurrentUser(store: PortalStore): PortalStore {
  return {
    ...store,
    currentUser: null,
  };
}

export function updateClientSession(
  store: PortalStore,
  clientId: string,
  updater: (session: PortalSession) => PortalSession,
) {
  return {
    ...store,
    clients: store.clients.map((client) =>
      client.user.id === clientId ? updater(client) : client,
    ),
    currentUser:
      store.currentUser?.role === 'client' && store.currentUser.id === clientId
        ? updater(store.clients.find((client) => client.user.id === clientId) ?? store.clients[0]).user
        : store.currentUser,
  };
}

function findClientIndex(store: PortalStore, email: string, phone: string) {
  return store.clients.findIndex((client) => {
    const sameEmail = email && normalizeEmail(client.user.email) === email;
    const samePhone = phone && normalizePhone(client.user.phone) === phone;
    return sameEmail || samePhone;
  });
}

export function findClientSession(store: PortalStore, options: { email?: string; phone?: string }) {
  const email = normalizeEmail(options.email ?? '');
  const phone = normalizePhone(options.phone);
  const clientIndex = findClientIndex(store, email, phone);

  return clientIndex >= 0 ? store.clients[clientIndex] : null;
}

export function setClientPassword(
  store: PortalStore,
  options: { email?: string; phone?: string },
  nextPassword: string,
): PortalStore {
  const email = normalizeEmail(options.email ?? '');
  const phone = normalizePhone(options.phone);
  const password = nextPassword.trim();
  const clientIndex = findClientIndex(store, email, phone);

  if (clientIndex < 0 || !password) {
    return store;
  }

  const existing = store.clients[clientIndex];
  const updatedSession: PortalSession = {
    ...existing,
    authPassword: password,
    updatedAt: new Date().toISOString(),
  };
  const clients = [...store.clients];

  clients[clientIndex] = updatedSession;

  return {
    ...store,
    clients,
    currentUser:
      store.currentUser?.role === 'client' && store.currentUser.id === updatedSession.user.id
        ? updatedSession.user
        : store.currentUser,
  };
}

export function applyAuthToStore(store: PortalStore, payload: AuthSuccessPayload): PortalStore {
  if (payload.role === 'admin') {
    return {
      ...store,
      currentUser: createAdminUser(),
    };
  }

  const email = normalizeEmail(payload.user.email);
  const phone = normalizePhone(payload.user.phone);
  const password = payload.user.password?.trim() ?? '';
  const clientIndex = findClientIndex(store, email, phone);

  if (clientIndex >= 0) {
    const existing = store.clients[clientIndex];

    if (payload.mode === 'register') {
      return store;
    }

    const updatedUser: PortalUser = {
      ...existing.user,
      name:
        payload.user.name?.trim() ||
        existing.user.name ||
        inferNameFromEmail(email) ||
        buildPhoneDisplayName(phone),
      email: email || existing.user.email,
      phone: phone || existing.user.phone,
      role: 'client',
    };

    let updatedSession: PortalSession = {
      ...existing,
      user: updatedUser,
      updatedAt: new Date().toISOString(),
      authPassword:
        payload.mode === 'register'
          ? password || existing.authPassword
          : existing.authPassword || password || undefined,
      leadGoal: existing.leadGoal,
    };

    const clients = [...store.clients];
    clients[clientIndex] = updatedSession;

    return {
      ...store,
      currentUser: updatedUser,
      clients,
    };
  }

  if (payload.mode === 'login') {
    return store;
  }

  const newClient = createPortalSession(
    {
      id: createPortalId('user'),
      name:
        payload.user.name?.trim() ||
        inferNameFromEmail(email) ||
        buildPhoneDisplayName(phone),
      email,
      phone,
      role: 'client',
    },
    {
      leadGoal: payload.mode === 'register' ? payload.leadGoal : undefined,
      password,
      withSeedProjects: false,
    },
  );

  return {
    ...store,
    currentUser: newClient.user,
    clients: [newClient, ...store.clients],
  };
}

export function getLastMessageForProject(session: PortalSession, projectId: string) {
  return [...session.messages]
    .filter((message) => message.projectId === projectId)
    .sort((left, right) => new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime())[0] ?? null;
}

export function countWaitingProjects(session: PortalSession) {
  return session.projects.filter((project) => getLastMessageForProject(session, project.id)?.author === 'client').length;
}
