import { motion } from 'motion/react';
import {
  Activity,
  BarChart3,
  Copy,
  Eye,
  EyeOff,
  LayoutDashboard,
  MessageSquareMore,
  Pencil,
  PieChart,
  Reply,
  Save,
  Search,
  ShieldCheck,
  Sparkles,
  Trash2,
  TrendingUp,
  UserRound,
  Users,
  X,
} from 'lucide-react';
import { useEffect, useState, type FormEvent } from 'react';
import { toast } from 'sonner';

import { copyTextToClipboard } from '../lib/clipboard';
import {
  type ComposePortalMessageInput,
  type CreateProjectInput,
  formatPortalDate,
  getClientSessionById,
  getLastMessageForProject,
  type PortalMessage,
  type PortalStore,
  type ProjectStatus,
} from '../lib/clientPortal';
import { serviceCategories } from '../lib/serviceCatalog';
import { Button } from './ui/button';
import { Checkbox } from './ui/checkbox';
import { Input } from './ui/input';
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from './ui/select';
import { Textarea } from './ui/textarea';

interface AdminDashboardProps {
  store: PortalStore;
  selectedClientId: string | null;
  selectedProjectId: string | null;
  onSelectClient: (clientId: string) => void;
  onSelectProject: (clientId: string, projectId: string) => void;
  onAssignProject: (clientId: string, input: CreateProjectInput) => void;
  onUpdateClientProfile: (
    clientId: string,
    input: {
      name: string;
      email: string;
      phone: string;
      password: string;
    },
  ) => { ok: true } | { ok: false; error: string };
  onDeleteClient: (clientId: string) => void;
  onSendMessage: (
    clientId: string,
    projectId: string,
    input: ComposePortalMessageInput,
  ) => void;
  onDeleteMessage: (clientId: string, messageId: string) => void;
  onEditMessage: (clientId: string, messageId: string, text: string) => PortalMessage | null;
  onDeleteProject: (clientId: string, projectId: string) => void;
  onSetProjectCompleted: (clientId: string, projectId: string, completed: boolean) => void;
}

interface AdminActivityEvent {
  id: string;
  type: 'client' | 'project' | 'message';
  title: string;
  description: string;
  createdAt: string;
  isAttention: boolean;
}

const STATUS_ORDER: ProjectStatus[] = [
  'Новый запрос',
  'В брифе',
  'В работе',
  'На согласовании',
  'Запущен',
];

const STATUS_STYLES: Record<
  ProjectStatus,
  {
    chipClass: string;
    fillClass: string;
    glowClass: string;
  }
> = {
  'Новый запрос': {
    chipClass: 'border-emerald-400/18 bg-emerald-400/10 text-emerald-100',
    fillClass: 'from-emerald-400 to-lime-300',
    glowClass: 'bg-emerald-400/18',
  },
  'В брифе': {
    chipClass: 'border-amber-400/18 bg-amber-400/10 text-amber-100',
    fillClass: 'from-amber-300 to-orange-400',
    glowClass: 'bg-amber-400/18',
  },
  'В работе': {
    chipClass: 'border-sky-400/18 bg-sky-400/10 text-sky-100',
    fillClass: 'from-sky-400 to-cyan-300',
    glowClass: 'bg-sky-400/18',
  },
  'На согласовании': {
    chipClass: 'border-fuchsia-400/18 bg-fuchsia-400/10 text-fuchsia-100',
    fillClass: 'from-fuchsia-500 to-purple-400',
    glowClass: 'bg-fuchsia-400/18',
  },
  'Запущен': {
    chipClass: 'border-violet-400/18 bg-violet-400/10 text-violet-100',
    fillClass: 'from-violet-500 to-blue-500',
    glowClass: 'bg-violet-400/18',
  },
};

const DONUT_COLORS = ['#4ade80', '#38bdf8', '#a78bfa', '#fbbf24', '#fb7185'];
const weekdayFormatter = new Intl.DateTimeFormat('ru-RU', { weekday: 'short' });
const calendarDayFormatter = new Intl.DateTimeFormat('ru-RU', {
  day: 'numeric',
  month: 'long',
});
const dateTimeFormatter = new Intl.DateTimeFormat('ru-RU', {
  day: 'numeric',
  month: 'short',
  hour: '2-digit',
  minute: '2-digit',
});

const messageActionButtonClassName =
  'inline-flex items-center gap-1 rounded-full border border-white/10 bg-white/6 px-2.5 py-1 text-[11px] text-white/62 transition-colors hover:bg-white/10 hover:text-white';

function truncateText(value: string, limit = 96) {
  const normalized = value.trim();
  if (normalized.length <= limit) return normalized;
  return `${normalized.slice(0, limit - 1)}…`;
}

function getDayKey(value: string | Date) {
  const date = value instanceof Date ? value : new Date(value);
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${date.getFullYear()}-${month}-${day}`;
}

function buildDonutBackground(items: Array<{ value: number; color: string }>) {
  const total = items.reduce((sum, item) => sum + item.value, 0);
  if (!total) {
    return 'conic-gradient(rgba(255,255,255,0.14) 0deg 360deg)';
  }

  let cursor = 0;
  const segments = items.map((item) => {
    const start = cursor;
    const end = cursor + (item.value / total) * 360;
    cursor = end;
    return `${item.color} ${start}deg ${end}deg`;
  });

  return `conic-gradient(${segments.join(', ')})`;
}

function formatEventDateTime(value: string) {
  return dateTimeFormatter.format(new Date(value));
}

export function AdminDashboard({
  store,
  selectedClientId,
  selectedProjectId,
  onSelectClient,
  onSelectProject,
  onAssignProject,
  onUpdateClientProfile,
  onDeleteClient,
  onSendMessage,
  onDeleteMessage,
  onEditMessage,
  onDeleteProject,
  onSetProjectCompleted,
}: AdminDashboardProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [messageText, setMessageText] = useState('');
  const [replyToMessage, setReplyToMessage] = useState<PortalMessage | null>(null);
  const [editingMessage, setEditingMessage] = useState<PortalMessage | null>(null);
  const [isClientPasswordVisible, setIsClientPasswordVisible] = useState(false);
  const [clientForm, setClientForm] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
  });
  const [assignmentForm, setAssignmentForm] = useState<CreateProjectInput>({
    name: '',
    service: '',
    deadline: '',
    budget: '',
    brief: '',
  });

  const normalizedSearch = searchQuery.trim().toLowerCase();
  const filteredClients = store.clients.filter((client) => {
    if (!normalizedSearch) return true;

    return (
      client.user.name.toLowerCase().includes(normalizedSearch) ||
      client.user.email.toLowerCase().includes(normalizedSearch) ||
      client.projects.some((project) => project.name.toLowerCase().includes(normalizedSearch))
    );
  });

  const selectedClient =
    getClientSessionById(store, selectedClientId) ?? filteredClients[0] ?? store.clients[0] ?? null;
  const selectedProject =
    selectedClient?.projects.find((project) => project.id === selectedProjectId) ??
    selectedClient?.projects[0] ??
    null;
  const selectedMessages =
    selectedClient && selectedProject
      ? [...selectedClient.messages]
          .filter((message) => message.projectId === selectedProject.id)
          .sort(
            (left, right) =>
              new Date(left.createdAt).getTime() - new Date(right.createdAt).getTime(),
          )
      : [];

  useEffect(() => {
    if (!selectedClient) {
      setClientForm({
        name: '',
        email: '',
        phone: '',
        password: '',
      });
      setIsClientPasswordVisible(false);
      return;
    }

    setClientForm({
      name: selectedClient.user.name,
      email: selectedClient.user.email,
      phone: selectedClient.user.phone ?? '',
      password: selectedClient.authPassword ?? '',
    });
    setIsClientPasswordVisible(false);
  }, [selectedClient]);

  useEffect(() => {
    if (!selectedClient) {
      setAssignmentForm({
        name: '',
        service: '',
        deadline: '',
        budget: '',
        brief: '',
      });
      return;
    }

    const leadBrief = selectedClient.leadGoal?.trim() ?? '';
    setAssignmentForm({
      name: leadBrief
        ? `Проект для ${selectedClient.user.name}`
        : `${selectedClient.user.name}: новая услуга`,
      service: '',
      deadline: '',
      budget: '',
      brief: leadBrief,
    });
  }, [selectedClient?.user.id]);

  useEffect(() => {
    if (!replyToMessage) return;

    const replyStillExists = selectedMessages.some((message) => message.id === replyToMessage.id);
    if (!replyStillExists) {
      setReplyToMessage(null);
    }
  }, [replyToMessage, selectedMessages]);

  useEffect(() => {
    if (!editingMessage) return;

    const activeEditingMessage = selectedMessages.find((message) => message.id === editingMessage.id);
    if (!activeEditingMessage) {
      setEditingMessage(null);
      return;
    }

    setEditingMessage(activeEditingMessage);
  }, [editingMessage, selectedMessages]);

  const allProjects = store.clients.flatMap((client) =>
    client.projects.map((project) => ({
      ...project,
      clientId: client.user.id,
      clientName: client.user.name,
      contact: client.user.email || client.user.phone || 'Без контакта',
      lastMessage: getLastMessageForProject(client, project.id),
    })),
  );
  const totalProjects = allProjects.length;
  const waitingProjectIds = new Set(
    allProjects
      .filter((project) => project.lastMessage?.author === 'client')
      .map((project) => project.id),
  );
  const waitingReplies = waitingProjectIds.size;
  const totalMessages = store.clients.reduce(
    (sum, client) => sum + client.messages.filter((message) => message.author !== 'system').length,
    0,
  );
  const averageProgress = totalProjects
    ? Math.round(allProjects.reduce((sum, project) => sum + project.progress, 0) / totalProjects)
    : 0;
  const responseCoverage = totalProjects
    ? Math.max(0, Math.round(((totalProjects - waitingReplies) / totalProjects) * 100))
    : 100;

  const statusStats = STATUS_ORDER.map((status) => {
    const projects = allProjects.filter((project) => project.status === status);

    return {
      status,
      count: projects.length,
      share: totalProjects ? (projects.length / totalProjects) * 100 : 0,
      waitingCount: projects.filter((project) => waitingProjectIds.has(project.id)).length,
      averageProgress: projects.length
        ? Math.round(
            projects.reduce((sum, project) => sum + project.progress, 0) / projects.length,
          )
        : 0,
    };
  });

  const serviceStats = Array.from(
    allProjects.reduce((accumulator, project) => {
      accumulator.set(project.service, (accumulator.get(project.service) ?? 0) + 1);
      return accumulator;
    }, new Map<string, number>()),
  )
    .sort((left, right) => right[1] - left[1])
    .map(([label, value], index) => ({
      label,
      value,
      share: totalProjects ? Math.round((value / totalProjects) * 100) : 0,
      color: DONUT_COLORS[index % DONUT_COLORS.length],
    }));

  const donutBackground = buildDonutBackground(
    serviceStats.map(({ value, color }) => ({ value, color })),
  );

  const managerStats = Array.from(
    allProjects.reduce((accumulator, project) => {
      const current = accumulator.get(project.managerName) ?? {
        projects: 0,
        waiting: 0,
        progressTotal: 0,
      };

      current.projects += 1;
      current.progressTotal += project.progress;
      if (waitingProjectIds.has(project.id)) {
        current.waiting += 1;
      }

      accumulator.set(project.managerName, current);
      return accumulator;
    }, new Map<string, { projects: number; waiting: number; progressTotal: number }>()),
  )
    .map(([name, metrics]) => ({
      name,
      projects: metrics.projects,
      waiting: metrics.waiting,
      averageProgress: Math.round(metrics.progressTotal / metrics.projects),
      share: totalProjects ? Math.round((metrics.projects / totalProjects) * 100) : 0,
    }))
    .sort((left, right) => right.projects - left.projects || right.waiting - left.waiting);

  const maxManagerProjects = Math.max(1, ...managerStats.map((manager) => manager.projects));
  const busiestManager = managerStats[0] ?? null;
  const strongestService = serviceStats[0] ?? null;

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const activitySeed = Array.from({ length: 7 }, (_, index) => {
    const date = new Date(today);
    date.setDate(date.getDate() - (6 - index));

    return {
      key: getDayKey(date),
      label: weekdayFormatter.format(date).replace('.', ''),
      fullDate: calendarDayFormatter.format(date),
      clients: 0,
      projects: 0,
      messages: 0,
      total: 0,
    };
  });

  const activityMap = new Map(activitySeed.map((entry) => [entry.key, { ...entry }]));

  store.clients.forEach((client) => {
    const clientEntry = activityMap.get(getDayKey(client.createdAt));
    if (clientEntry) {
      clientEntry.clients += 1;
    }

    client.projects.forEach((project) => {
      const projectEntry = activityMap.get(getDayKey(project.updatedAt));
      if (projectEntry) {
        projectEntry.projects += 1;
      }
    });

    client.messages.forEach((message) => {
      if (message.author === 'system') return;

      const messageEntry = activityMap.get(getDayKey(message.createdAt));
      if (messageEntry) {
        messageEntry.messages += 1;
      }
    });
  });

  const activityDays = activitySeed.map((entry) => {
    const day = activityMap.get(entry.key) ?? entry;
    const total = day.clients * 3 + day.projects * 2 + day.messages;

    return {
      ...day,
      total,
    };
  });

  const maxActivity = Math.max(1, ...activityDays.map((day) => day.total));
  const peakDay =
    activityDays.reduce(
      (best, day) => (day.total > best.total ? day : best),
      activityDays[0] ?? {
        key: 'none',
        label: 'нет',
        fullDate: 'нет данных',
        clients: 0,
        projects: 0,
        messages: 0,
        total: 0,
      },
    ) ?? null;
  const totalActivitySignals = activityDays.reduce(
    (sum, day) => sum + day.clients + day.projects + day.messages,
    0,
  );

  const recentActivity: AdminActivityEvent[] = [
    ...store.clients.map((client) => ({
      id: `client-${client.user.id}-${client.createdAt}`,
      type: 'client' as const,
      title: `Подключён клиент ${client.user.name}`,
      description: client.user.email || client.user.phone || 'Контакт пока не заполнен',
      createdAt: client.createdAt,
      isAttention: false,
    })),
    ...allProjects.map((project) => ({
      id: `project-${project.id}-${project.updatedAt}`,
      type: 'project' as const,
      title: `Обновлён проект "${project.name}"`,
      description: `${project.clientName} · ${project.status} · готовность ${project.progress}%`,
      createdAt: project.updatedAt,
      isAttention: waitingProjectIds.has(project.id),
    })),
    ...store.clients.flatMap((client) =>
      client.messages
        .filter((message) => message.author !== 'system')
        .map((message) => {
          const projectName =
            client.projects.find((project) => project.id === message.projectId)?.name ?? 'Проект';

          return {
            id: `message-${message.id}`,
            type: 'message' as const,
            title:
              message.author === 'client'
                ? `${client.user.name} написал в онлайн-чат`
                : `${message.authorName} отправил ответ`,
            description: `${projectName} · ${truncateText(message.text, 82)}`,
            createdAt: message.createdAt,
            isAttention: message.author === 'client',
          };
        }),
    ),
  ]
    .sort((left, right) => new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime())
    .slice(0, 8);

  const waitingQueue = allProjects
    .filter((project) => waitingProjectIds.has(project.id))
    .sort((left, right) => {
      const rightTime = new Date(right.lastMessage?.createdAt ?? right.updatedAt).getTime();
      const leftTime = new Date(left.lastMessage?.createdAt ?? left.updatedAt).getTime();
      return rightTime - leftTime;
    })
    .slice(0, 5);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!selectedClient || !selectedProject || !messageText.trim()) return;

    if (editingMessage) {
      const updatedMessage = onEditMessage(
        selectedClient.user.id,
        editingMessage.id,
        messageText.trim(),
      );
      if (!updatedMessage) return;

      setMessageText('');
      setEditingMessage(null);
      toast.success('Сообщение изменено');
      return;
    }

    onSendMessage(selectedClient.user.id, selectedProject.id, {
      text: messageText.trim(),
      replyToMessage,
    });
    setMessageText('');
    setReplyToMessage(null);
  }

  async function handleCopyMessage(message: PortalMessage) {
    try {
      await copyTextToClipboard(message.text);
      toast.success('Сообщение скопировано');
    } catch {
      toast.error('Не удалось скопировать сообщение');
    }
  }

  function handleReplyMessage(message: PortalMessage) {
    if (message.author === 'system') return;
    if (editingMessage?.id) {
      setEditingMessage(null);
      setMessageText('');
    }
    setReplyToMessage(message);
  }

  function handleStartEditingMessage(message: PortalMessage) {
    if (message.author === 'system') return;

    setReplyToMessage(null);
    setEditingMessage(message);
    setMessageText(message.text);
  }

  function handleDeleteMessage(message: PortalMessage) {
    if (!selectedClient || message.author !== 'manager') return;

    const confirmed = window.confirm('Удалить это сообщение из переписки?');
    if (!confirmed) return;

    onDeleteMessage(selectedClient.user.id, message.id);
    if (replyToMessage?.id === message.id) {
      setReplyToMessage(null);
    }
    if (editingMessage?.id === message.id) {
      setEditingMessage(null);
      setMessageText('');
    }
    toast.success('Сообщение удалено');
  }

  function handleDeleteProject() {
    if (!selectedClient || !selectedProject) return;

    const confirmed = window.confirm(
      `Удалить проект "${selectedProject.name}" вместе со всей перепиской по нему?`,
    );
    if (!confirmed) return;

    onDeleteProject(selectedClient.user.id, selectedProject.id);
    setReplyToMessage(null);
    setEditingMessage(null);
    setMessageText('');

    toast.success('Проект удалён', {
      description: 'Карточка проекта и все сообщения по нему убраны из кабинета клиента.',
    });
  }

  function handleCompletedChange(checked: boolean) {
    if (!selectedClient || !selectedProject) return;

    onSetProjectCompleted(selectedClient.user.id, selectedProject.id, checked);
    toast.success(checked ? 'Проект отмечен как выполненный' : 'Проект возвращён в работу', {
      description: checked
        ? 'Статус проекта обновлён до "Запущен" и клиент увидит завершение в кабинете.'
        : 'Статус проекта снова переведён в "В работе".',
    });
  }

  function updateAssignmentField<Key extends keyof CreateProjectInput>(
    field: Key,
    value: CreateProjectInput[Key],
  ) {
    setAssignmentForm((prev) => ({ ...prev, [field]: value }));
  }

  function updateClientField(
    field: 'name' | 'email' | 'phone' | 'password',
    value: string,
  ) {
    setClientForm((prev) => ({ ...prev, [field]: value }));
  }

  function handleSaveClientProfile(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!selectedClient) return;

    if (!clientForm.name.trim() || !clientForm.email.trim()) {
      toast.error('Нужно указать имя и почту клиента');
      return;
    }

    if (clientForm.password.trim().length < 6) {
      toast.error('Пароль клиента слишком короткий', {
        description: 'Минимальная длина пароля — 6 символов.',
      });
      return;
    }

    const result = onUpdateClientProfile(selectedClient.user.id, clientForm);
    if (!result.ok) {
      toast.error('Не удалось обновить клиента', {
        description: result.error,
      });
      return;
    }

    toast.success('Данные клиента обновлены', {
      description: `Почта, телефон и пароль для ${selectedClient.user.name} сохранены.`,
    });
  }

  function handleDeleteClient() {
    if (!selectedClient) return;

    const confirmed = window.confirm(
      `Удалить пользователя ${selectedClient.user.name} вместе со всеми проектами и переписками?`,
    );

    if (!confirmed) return;

    onDeleteClient(selectedClient.user.id);
    toast.success('Пользователь удалён', {
      description: 'Клиент, его проекты и переписки убраны из админ-панели.',
    });
  }

  function handleAssignProject(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!selectedClient) return;

    if (!assignmentForm.name.trim() || !assignmentForm.service.trim()) {
      toast.error('Нужно указать название проекта и услугу');
      return;
    }

    onAssignProject(selectedClient.user.id, {
      ...assignmentForm,
      brief:
        assignmentForm.brief.trim() ||
        selectedClient.leadGoal?.trim() ||
        'Услуга назначена администратором из админ-панели.',
    });

    toast.success('Услуга назначена клиенту', {
      description: `Проект добавлен в кабинет ${selectedClient.user.name}.`,
    });

    setAssignmentForm({
      name: `${selectedClient.user.name}: новая услуга`,
      service: '',
      deadline: '',
      budget: '',
      brief: '',
    });
  }

  return (
    <section id="кабинет-сводка" className="relative overflow-hidden bg-black pb-16 pt-28 sm:pb-20 sm:pt-32">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(34,197,94,0.14),transparent_26%),radial-gradient(circle_at_bottom_right,rgba(59,130,246,0.16),transparent_28%)]" />

      <div className="content-shell relative z-10 space-y-8">
        <div className="grid gap-4 lg:grid-cols-[1.5fr_1fr]">
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            className="rounded-[2rem] border border-white/10 bg-white/6 p-6 shadow-2xl shadow-blue-950/20 backdrop-blur sm:p-8"
          >
            <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/6 px-3 py-1 text-xs uppercase tracking-[0.24em] text-white/55">
              <ShieldCheck className="h-3.5 w-3.5" />
              Админ-панель
            </div>

            <h1 className="mt-5 max-w-3xl text-3xl font-semibold leading-tight text-white sm:text-4xl lg:text-[2.8rem]">
              Все клиенты, проекты, активность и переписки в одном окне.
            </h1>
            <p className="mt-4 max-w-2xl text-sm leading-7 text-white/68 sm:text-base">
              Панель теперь показывает не только список клиентов, но и динамику по проектам,
              сводку по статусам, нагрузку команды и живую активность по чатам.
            </p>
          </motion.div>

          <div className="grid gap-4 sm:grid-cols-3 lg:grid-cols-1">
            {[
              {
                label: 'Клиенты',
                value: String(store.clients.length),
                icon: Users,
                note: 'аккаунтов в системе',
              },
              {
                label: 'Проекты',
                value: String(totalProjects),
                icon: LayoutDashboard,
                note: 'всего карточек по клиентам',
              },
              {
                label: 'Сообщения',
                value: String(totalMessages),
                icon: MessageSquareMore,
                note: 'живых сообщений без системных уведомлений',
              },
            ].map(({ label, value, icon: Icon, note }) => (
              <motion.div
                key={label}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="rounded-[1.6rem] border border-white/10 bg-white/6 p-5 backdrop-blur"
              >
                <div className="flex items-center justify-between">
                  <p className="text-sm text-white/60">{label}</p>
                  <span className="rounded-full border border-white/10 bg-white/6 p-2 text-white/80">
                    <Icon className="h-4 w-4" />
                  </span>
                </div>
                <p className="mt-4 text-3xl font-semibold text-white">{value}</p>
                <p className="mt-2 text-sm text-white/50">{note}</p>
              </motion.div>
            ))}
          </div>
        </div>

        <div className="grid gap-4 xl:grid-cols-[1.2fr_0.8fr]">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="rounded-[1.8rem] border border-white/10 bg-white/6 p-5 backdrop-blur sm:p-6"
          >
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <p className="text-lg font-semibold text-white">Сводка по воронке</p>
                <p className="mt-1 text-sm text-white/58">
                  Статусы показывают, где сейчас лежит поток задач и где скапливается внимание.
                </p>
              </div>
              <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/6 px-3 py-1 text-xs uppercase tracking-[0.18em] text-white/55">
                <BarChart3 className="h-3.5 w-3.5" />
                Воронка
              </span>
            </div>

            <div className="mt-5 grid gap-3 sm:grid-cols-3">
              <div className="rounded-[1.4rem] border border-white/10 bg-black/30 p-4">
                <p className="text-xs uppercase tracking-[0.18em] text-white/40">Средний прогресс</p>
                <p className="mt-3 text-3xl font-semibold text-white">{averageProgress}%</p>
                <p className="mt-2 text-sm text-white/55">по всем активным карточкам</p>
              </div>
              <div className="rounded-[1.4rem] border border-white/10 bg-black/30 p-4">
                <p className="text-xs uppercase tracking-[0.18em] text-white/40">Покрытие ответов</p>
                <p className="mt-3 text-3xl font-semibold text-white">{responseCoverage}%</p>
                <p className="mt-2 text-sm text-white/55">проектов без ожидания ответа</p>
              </div>
              <div className="rounded-[1.4rem] border border-white/10 bg-black/30 p-4">
                <p className="text-xs uppercase tracking-[0.18em] text-white/40">Лидер нагрузки</p>
                <p className="mt-3 text-xl font-semibold text-white">
                  {busiestManager?.name ?? 'Команда пока пуста'}
                </p>
                <p className="mt-2 text-sm text-white/55">
                  {busiestManager ? `${busiestManager.projects} проектов в работе` : 'Нет данных'}
                </p>
              </div>
            </div>

            <div className="mt-6 overflow-hidden rounded-[1.5rem] border border-white/10 bg-black/30 p-3">
              <div className="flex h-6 gap-2">
                {statusStats.map((item) => (
                  <div
                    key={item.status}
                    className={`rounded-full bg-gradient-to-r ${STATUS_STYLES[item.status].fillClass}`}
                    style={{
                      width: totalProjects
                        ? `${Math.max(item.share, item.count > 0 ? 8 : 0)}%`
                        : '20%',
                      opacity: item.count > 0 ? 1 : 0.18,
                    }}
                  />
                ))}
              </div>
            </div>

            <div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
              {statusStats.map((item) => (
                <div
                  key={item.status}
                  className={`rounded-[1.5rem] border p-4 ${STATUS_STYLES[item.status].chipClass}`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-sm font-medium text-white">{item.status}</p>
                      <p className="mt-2 text-3xl font-semibold text-white">{item.count}</p>
                    </div>
                    <span className={`h-10 w-10 rounded-full ${STATUS_STYLES[item.status].glowClass}`} />
                  </div>
                  <div className="mt-4 h-2 overflow-hidden rounded-full bg-black/30">
                    <div
                      className={`h-full rounded-full bg-gradient-to-r ${STATUS_STYLES[item.status].fillClass}`}
                      style={{ width: `${item.share}%` }}
                    />
                  </div>
                  <div className="mt-3 flex items-center justify-between text-xs text-white/65">
                    <span>{Math.round(item.share)}% потока</span>
                    <span>{item.averageProgress}% готовности</span>
                  </div>
                  <p className="mt-2 text-xs text-white/58">
                    {item.waitingCount > 0
                      ? `${item.waitingCount} ждут ответа менеджера`
                      : 'Очередь внутри статуса чистая'}
                  </p>
                </div>
              ))}
            </div>
          </motion.div>

          <div className="grid gap-4">
            <motion.div
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              className="rounded-[1.8rem] border border-white/10 bg-white/6 p-5 backdrop-blur sm:p-6"
            >
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-lg font-semibold text-white">Структура услуг</p>
                  <p className="mt-1 text-sm text-white/58">
                    Распределение портфеля по типам услуг и точка роста.
                  </p>
                </div>
                <PieChart className="h-5 w-5 text-cyan-200" />
              </div>

              <div className="mt-6 flex flex-col items-center gap-6 lg:flex-row lg:items-center lg:justify-between">
                <div
                  className="relative h-48 w-48 rounded-full border border-white/10"
                  style={{ background: donutBackground }}
                >
                  <div className="absolute inset-[18%] rounded-full border border-white/10 bg-black/85 backdrop-blur">
                    <div className="flex h-full flex-col items-center justify-center">
                      <span className="text-3xl font-semibold text-white">{totalProjects}</span>
                      <span className="mt-1 text-[11px] uppercase tracking-[0.24em] text-white/45">
                        проектов
                      </span>
                    </div>
                  </div>
                </div>

                <div className="w-full space-y-3">
                  {serviceStats.length > 0 ? (
                    serviceStats.map((service) => (
                      <div
                        key={service.label}
                        className="rounded-[1.2rem] border border-white/10 bg-black/30 px-4 py-3"
                      >
                        <div className="flex items-center justify-between gap-3">
                          <div className="flex items-center gap-3">
                            <span
                              className="h-3 w-3 rounded-full"
                              style={{ backgroundColor: service.color }}
                            />
                            <p className="text-sm font-medium text-white">{service.label}</p>
                          </div>
                          <p className="text-sm text-white/65">{service.value}</p>
                        </div>
                        <div className="mt-3 h-2 overflow-hidden rounded-full bg-white/8">
                          <div
                            className="h-full rounded-full"
                            style={{
                              width: `${service.share}%`,
                              backgroundColor: service.color,
                            }}
                          />
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="rounded-[1.2rem] border border-dashed border-white/12 bg-black/25 p-5 text-sm text-white/55">
                      Как только появятся проекты, здесь сразу соберётся структура услуг.
                    </div>
                  )}

                  <div className="rounded-[1.2rem] border border-white/10 bg-black/30 p-4 text-sm text-white/68">
                    Доминантный сегмент: {strongestService?.label ?? 'ещё не определился'}
                    {strongestService ? `, это ${strongestService.share}% от всего портфеля.` : '.'}
                  </div>
                </div>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              className="rounded-[1.8rem] border border-white/10 bg-white/6 p-5 backdrop-blur sm:p-6"
            >
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-lg font-semibold text-white">Загрузка команды</p>
                  <p className="mt-1 text-sm text-white/58">
                    Кому сейчас достаётся больше всего проектов и кто держит очередь.
                  </p>
                </div>
                <TrendingUp className="h-5 w-5 text-cyan-200" />
              </div>

              <div className="mt-5 space-y-3">
                {managerStats.length > 0 ? (
                  managerStats.map((manager) => (
                    <div
                      key={manager.name}
                      className="rounded-[1.3rem] border border-white/10 bg-black/30 px-4 py-4"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="text-sm font-medium text-white">{manager.name}</p>
                          <p className="mt-1 text-xs text-white/52">
                            {manager.averageProgress}% средняя готовность по задачам
                          </p>
                        </div>
                        <span className="rounded-full border border-white/10 bg-white/6 px-3 py-1 text-xs text-white/70">
                          {manager.projects} проектов
                        </span>
                      </div>
                      <div className="mt-4 h-2 overflow-hidden rounded-full bg-white/8">
                        <div
                          className="h-full rounded-full bg-gradient-to-r from-cyan-400 via-blue-500 to-purple-500"
                          style={{
                            width: `${(manager.projects / maxManagerProjects) * 100}%`,
                          }}
                        />
                      </div>
                      <div className="mt-3 flex items-center justify-between text-xs text-white/58">
                        <span>{manager.share}% общей загрузки</span>
                        <span>
                          {manager.waiting > 0
                            ? `${manager.waiting} проекта ждут ответа`
                            : 'Очередь без зависаний'}
                        </span>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="rounded-[1.3rem] border border-dashed border-white/12 bg-black/25 p-5 text-sm text-white/55">
                    Команда появится здесь, когда в системе будут проекты с менеджерами.
                  </div>
                )}
              </div>
            </motion.div>
          </div>
        </div>

        <div id="кабинет-активность" className="grid gap-4 xl:grid-cols-[1.15fr_0.85fr]">
          <motion.div
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            className="rounded-[1.8rem] border border-white/10 bg-white/6 p-5 backdrop-blur sm:p-6"
          >
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <p className="text-lg font-semibold text-white">Активность за 7 дней</p>
                <p className="mt-1 text-sm text-white/58">
                  Взвешенная динамика по клиентам, проектам и живым чатам.
                </p>
              </div>
              <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/6 px-3 py-1 text-xs uppercase tracking-[0.18em] text-white/55">
                <Activity className="h-3.5 w-3.5" />
                Пульс
              </span>
            </div>

            <div className="mt-5 grid gap-3 sm:grid-cols-3">
              <div className="rounded-[1.4rem] border border-white/10 bg-black/30 p-4">
                <p className="text-xs uppercase tracking-[0.18em] text-white/40">Сигналы</p>
                <p className="mt-3 text-3xl font-semibold text-white">{totalActivitySignals}</p>
                <p className="mt-2 text-sm text-white/55">событий за последнюю неделю</p>
              </div>
              <div className="rounded-[1.4rem] border border-white/10 bg-black/30 p-4">
                <p className="text-xs uppercase tracking-[0.18em] text-white/40">Пик недели</p>
                <p className="mt-3 text-3xl font-semibold text-white">{peakDay?.label ?? 'нет'}</p>
                <p className="mt-2 text-sm text-white/55">{peakDay?.fullDate ?? 'Нет активности'}</p>
              </div>
              <div className="rounded-[1.4rem] border border-white/10 bg-black/30 p-4">
                <p className="text-xs uppercase tracking-[0.18em] text-white/40">Фокус</p>
                <p className="mt-3 text-xl font-semibold text-white">
                  {waitingReplies > 0 ? `${waitingReplies} ждут ответа` : 'Очередь чистая'}
                </p>
                <p className="mt-2 text-sm text-white/55">проектов требуют реакции менеджера</p>
              </div>
            </div>

            <div className="mt-6 grid h-[280px] grid-cols-7 gap-3">
              {activityDays.map((day) => (
                <div key={day.key} className="flex flex-col gap-3">
                  <div className="flex h-full items-end">
                    <div className="flex h-full w-full items-end rounded-[1.3rem] border border-white/10 bg-black/30 p-2">
                      <div
                        className="flex w-full flex-col justify-end gap-1 overflow-hidden rounded-[0.9rem]"
                        style={{
                          height: `${Math.max((day.total / maxActivity) * 100, day.total > 0 ? 14 : 6)}%`,
                        }}
                      >
                        {day.clients > 0 && (
                          <div
                            className="rounded-[0.75rem] bg-amber-300/90"
                            style={{ flexGrow: day.clients * 3 }}
                          />
                        )}
                        {day.projects > 0 && (
                          <div
                            className="rounded-[0.75rem] bg-cyan-400/90"
                            style={{ flexGrow: day.projects * 2 }}
                          />
                        )}
                        {day.messages > 0 && (
                          <div
                            className="rounded-[0.75rem] bg-fuchsia-400/90"
                            style={{ flexGrow: day.messages }}
                          />
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="text-center">
                    <p className="text-xs font-medium text-white/78">{day.label}</p>
                    <p className="mt-1 text-[11px] text-white/45">{day.total}</p>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-6 flex flex-wrap items-center gap-4 text-xs text-white/58">
              <div className="inline-flex items-center gap-2">
                <span className="h-2.5 w-2.5 rounded-full bg-amber-300/90" />
                Новые клиенты
              </div>
              <div className="inline-flex items-center gap-2">
                <span className="h-2.5 w-2.5 rounded-full bg-cyan-400/90" />
                Обновления проектов
              </div>
              <div className="inline-flex items-center gap-2">
                <span className="h-2.5 w-2.5 rounded-full bg-fuchsia-400/90" />
                Сообщения в чатах
              </div>
            </div>
          </motion.div>

          <div className="grid gap-4">
            <motion.div
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              className="rounded-[1.8rem] border border-white/10 bg-white/6 p-5 backdrop-blur sm:p-6"
            >
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-lg font-semibold text-white">Лента активности</p>
                  <p className="mt-1 text-sm text-white/58">
                    Последние события по клиентам, проектам и сообщениям.
                  </p>
                </div>
                <Sparkles className="h-5 w-5 text-cyan-200" />
              </div>

              <div className="mt-5 space-y-3">
                {recentActivity.length > 0 ? (
                  recentActivity.map((event) => {
                    const toneClass =
                      event.type === 'message'
                        ? 'border-cyan-400/16 bg-cyan-400/10 text-cyan-100'
                        : event.type === 'project'
                          ? 'border-blue-400/14 bg-blue-400/10 text-blue-100'
                          : 'border-amber-400/16 bg-amber-400/10 text-amber-100';

                    const Icon =
                      event.type === 'message'
                        ? MessageSquareMore
                        : event.type === 'project'
                          ? LayoutDashboard
                          : Users;

                    return (
                      <div
                        key={event.id}
                        className={`rounded-[1.3rem] border px-4 py-4 ${toneClass}`}
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex items-start gap-3">
                            <span className="mt-0.5 rounded-full border border-white/10 bg-black/20 p-2">
                              <Icon className="h-4 w-4" />
                            </span>
                            <div>
                              <p className="text-sm font-medium text-white">{event.title}</p>
                              <p className="mt-1 text-sm leading-6 text-white/68">
                                {event.description}
                              </p>
                            </div>
                          </div>
                          {event.isAttention && (
                            <span className="rounded-full border border-white/10 bg-black/20 px-2.5 py-1 text-[11px] uppercase tracking-[0.16em] text-white/60">
                              В фокусе
                            </span>
                          )}
                        </div>
                        <p className="mt-3 text-[11px] uppercase tracking-[0.16em] text-white/42">
                          {formatEventDateTime(event.createdAt)}
                        </p>
                      </div>
                    );
                  })
                ) : (
                  <div className="rounded-[1.3rem] border border-dashed border-white/12 bg-black/25 p-5 text-sm text-white/55">
                    Лента оживёт сразу после первых клиентов и переписок.
                  </div>
                )}
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              className="rounded-[1.8rem] border border-white/10 bg-white/6 p-5 backdrop-blur sm:p-6"
            >
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-lg font-semibold text-white">Требуют ответа</p>
                  <p className="mt-1 text-sm text-white/58">
                    Быстрый список диалогов, где последним написал клиент.
                  </p>
                </div>
                <TrendingUp className="h-5 w-5 text-cyan-200" />
              </div>

              <div className="mt-5 rounded-[1.3rem] border border-white/10 bg-black/30 p-4">
                <div className="flex items-center justify-between gap-3 text-sm text-white/65">
                  <span>Чистота очереди</span>
                  <span>{responseCoverage}%</span>
                </div>
                <div className="mt-3 h-2 overflow-hidden rounded-full bg-white/8">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-emerald-400 via-cyan-400 to-blue-500"
                    style={{ width: `${responseCoverage}%` }}
                  />
                </div>
              </div>

              <div className="mt-4 space-y-3">
                {waitingQueue.length > 0 ? (
                  waitingQueue.map((project) => (
                    <div
                      key={project.id}
                      className="rounded-[1.3rem] border border-white/10 bg-black/30 px-4 py-4"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="text-sm font-medium text-white">{project.name}</p>
                          <p className="mt-1 text-xs text-white/52">
                            {project.clientName} · {project.contact}
                          </p>
                        </div>
                        <span className="rounded-full border border-cyan-400/20 bg-cyan-400/10 px-2.5 py-1 text-[11px] text-cyan-100">
                          {project.status}
                        </span>
                      </div>
                      <p className="mt-3 text-sm leading-6 text-white/65">
                        {truncateText(project.lastMessage?.text ?? project.brief, 88)}
                      </p>
                      <div className="mt-3 flex items-center justify-between text-[11px] uppercase tracking-[0.16em] text-white/40">
                        <span>{project.lastMessage?.authorName ?? project.managerName}</span>
                        <span>{formatEventDateTime(project.lastMessage?.createdAt ?? project.updatedAt)}</span>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="rounded-[1.3rem] border border-dashed border-white/12 bg-black/25 p-5 text-sm text-white/55">
                    Сейчас все клиентские диалоги обработаны, очередь пустая.
                  </div>
                )}
              </div>
            </motion.div>
          </div>
        </div>

        <div id="кабинет-проекты" className="grid gap-4 xl:grid-cols-[0.95fr_1.05fr]">
          <div className="rounded-[1.8rem] border border-white/10 bg-white/6 p-5 backdrop-blur sm:p-6">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-lg font-semibold text-white">Клиенты и их проекты</p>
                <p className="mt-1 text-sm text-white/58">
                  Поиск по клиенту, почте и названию проекта.
                </p>
              </div>

              <div className="relative min-w-[18rem]">
                <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-white/40">
                  <Search className="h-4 w-4" />
                </span>
                <Input
                  value={searchQuery}
                  onChange={(event) => setSearchQuery(event.target.value)}
                  placeholder="Найти клиента или проект"
                  aria-label="Найти клиента или проект"
                  className="h-11 w-full min-w-[18rem] rounded-full border-white/10 bg-white/6 pl-11 pr-4 text-white placeholder:text-white/35 focus-visible:border-blue-400/50 focus-visible:ring-blue-400/20"
                />
              </div>
            </div>

            <div className="mt-5 space-y-4">
              {filteredClients.map((client) => {
                const isSelectedClient = selectedClient?.user.id === client.user.id;

                return (
                  <div
                    key={client.user.id}
                    className={`rounded-[1.5rem] border p-4 transition-colors ${
                      isSelectedClient
                        ? 'border-cyan-400/30 bg-cyan-400/10'
                        : 'border-white/10 bg-black/30'
                    }`}
                  >
                    <button
                      type="button"
                      onClick={() => onSelectClient(client.user.id)}
                      className="w-full text-left"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="text-lg font-semibold text-white">{client.user.name}</p>
                          <p className="mt-1 text-sm text-white/55">{client.user.email || client.user.phone}</p>
                        </div>
                        <span className="rounded-full border border-white/10 bg-white/6 px-3 py-1 text-xs text-white/70">
                          {client.projects.length} проектов
                        </span>
                      </div>
                    </button>

                    {client.leadGoal && (
                      <div className="mt-4 rounded-2xl border border-amber-400/18 bg-amber-400/10 px-4 py-3 text-sm text-amber-100/90">
                        Запрос клиента: {truncateText(client.leadGoal, 120)}
                      </div>
                    )}

                    {client.projects.length > 0 ? (
                      <div className="mt-4 space-y-2">
                        {client.projects.map((project) => {
                          const lastMessage = getLastMessageForProject(client, project.id);
                          const isSelectedProject = selectedProject?.id === project.id && isSelectedClient;

                          return (
                            <button
                              key={project.id}
                              type="button"
                              onClick={() => onSelectProject(client.user.id, project.id)}
                              className={`w-full rounded-2xl border px-4 py-3 text-left transition-colors ${
                                isSelectedProject
                                  ? 'border-cyan-400/35 bg-cyan-400/12 text-cyan-100'
                                  : 'border-white/10 bg-white/6 text-white/75 hover:bg-white/10'
                              }`}
                            >
                              <div className="flex items-center justify-between gap-3">
                                <span className="font-medium">{project.name}</span>
                                <span className="text-xs opacity-70">{project.status}</span>
                              </div>
                              <p className="mt-2 text-xs opacity-65">
                                {lastMessage?.authorName ?? 'Без сообщений'} · {lastMessage?.text ?? 'Чат пока пустой'}
                              </p>
                            </button>
                          );
                        })}
                      </div>
                    ) : (
                      <div className="mt-4 rounded-2xl border border-dashed border-white/12 bg-black/25 px-4 py-4 text-sm text-white/55">
                        Пока нет проектов. Назначьте клиенту первую услугу справа.
                      </div>
                    )}
                  </div>
                );
              })}

              {filteredClients.length === 0 && (
                <div className="rounded-[1.5rem] border border-dashed border-white/12 bg-black/25 p-8 text-center text-white/55">
                  По этому запросу пока ничего не найдено.
                </div>
              )}
            </div>
          </div>

          <div id="кабинет-чат" className="rounded-[1.8rem] border border-white/10 bg-white/6 p-5 backdrop-blur sm:p-6">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-lg font-semibold text-white">Назначение услуги и чат</p>
                <p className="mt-1 text-sm text-white/58">
                  Сначала админ может назначить услугу и создать проект, затем вести переписку.
                </p>
              </div>
              <MessageSquareMore className="h-5 w-5 text-cyan-200" />
            </div>

            {selectedClient ? (
              <>
                <div className="mt-5 rounded-[1.5rem] border border-white/10 bg-black/30 p-4">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <p className="text-xl font-semibold text-white">{selectedClient.user.name}</p>
                      <p className="mt-2 text-sm text-white/62">
                        {selectedClient.user.email || selectedClient.user.phone || 'Контакт не указан'}
                      </p>
                    </div>
                    <span className="rounded-full border border-white/10 bg-white/6 px-3 py-1 text-xs text-white/70">
                      {selectedClient.projects.length > 0
                        ? `${selectedClient.projects.length} проектов`
                        : 'Без проектов'}
                    </span>
                  </div>

                  <div className="mt-4 rounded-2xl border border-amber-400/18 bg-amber-400/10 p-4 text-sm text-amber-100/90">
                    <p className="font-medium text-white">Заявка клиента</p>
                    <p className="mt-2 leading-6">
                      {selectedClient.leadGoal?.trim() || 'Клиент зарегистрирован, но ещё не оставил уточнённую заявку.'}
                    </p>
                  </div>
                </div>

                <form onSubmit={handleSaveClientProfile} className="mt-4 space-y-3 rounded-[1.5rem] border border-white/10 bg-black/25 p-4">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="text-base font-semibold text-white">Данные пользователя</p>
                      <p className="mt-1 text-sm text-white/58">
                        Админ может видеть и менять почту, телефон и пароль клиента.
                      </p>
                    </div>
                    <span className="rounded-full border border-white/10 bg-white/6 px-3 py-1 text-xs text-white/70">
                      Доступы
                    </span>
                  </div>

                  <Input
                    value={clientForm.name}
                    onChange={(event) => updateClientField('name', event.target.value)}
                    placeholder="Имя клиента"
                    className="h-11 rounded-2xl border-white/10 bg-white/6 text-white placeholder:text-white/35 focus-visible:border-blue-400/50 focus-visible:ring-blue-400/20"
                  />

                  <div className="grid gap-3 sm:grid-cols-2">
                    <Input
                      value={clientForm.email}
                      onChange={(event) => updateClientField('email', event.target.value)}
                      placeholder="Почта клиента"
                      className="h-11 rounded-2xl border-white/10 bg-white/6 text-white placeholder:text-white/35 focus-visible:border-blue-400/50 focus-visible:ring-blue-400/20"
                    />
                    <Input
                      value={clientForm.phone}
                      onChange={(event) => updateClientField('phone', event.target.value)}
                      placeholder="Телефон клиента"
                      className="h-11 rounded-2xl border-white/10 bg-white/6 text-white placeholder:text-white/35 focus-visible:border-blue-400/50 focus-visible:ring-blue-400/20"
                    />
                  </div>

                  <div className="relative">
                    <Input
                      value={clientForm.password}
                      onChange={(event) => updateClientField('password', event.target.value)}
                      type={isClientPasswordVisible ? 'text' : 'password'}
                      placeholder="Пароль клиента"
                      className="h-11 rounded-2xl border-white/10 bg-white/6 pr-12 text-white placeholder:text-white/35 focus-visible:border-blue-400/50 focus-visible:ring-blue-400/20"
                    />
                    <button
                      type="button"
                      onClick={() => setIsClientPasswordVisible((prev) => !prev)}
                      className="absolute right-3 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full text-white/55 transition-colors hover:bg-white/8 hover:text-white"
                      aria-label={isClientPasswordVisible ? 'Скрыть пароль клиента' : 'Показать пароль клиента'}
                    >
                      {isClientPasswordVisible ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>

                  <div className="flex flex-col gap-3 sm:flex-row">
                    <Button
                      type="submit"
                      className="h-11 flex-1 rounded-full bg-gradient-to-r from-cyan-400 via-blue-500 to-violet-500 text-white hover:opacity-95"
                    >
                      <Save className="h-4 w-4" />
                      Сохранить данные
                    </Button>
                    <Button
                      type="button"
                      onClick={handleDeleteClient}
                      className="h-11 rounded-full bg-gradient-to-r from-rose-500 to-red-600 text-white hover:opacity-95"
                    >
                      <Trash2 className="h-4 w-4" />
                      Удалить пользователя
                    </Button>
                  </div>
                </form>

                <form onSubmit={handleAssignProject} className="mt-4 space-y-3 rounded-[1.5rem] border border-white/10 bg-black/25 p-4">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="text-base font-semibold text-white">Назначить услугу клиенту</p>
                      <p className="mt-1 text-sm text-white/58">
                        После создания проект сразу появится в кабинете пользователя.
                      </p>
                    </div>
                    <span className="rounded-full border border-cyan-400/18 bg-cyan-400/10 px-3 py-1 text-xs text-cyan-100">
                      Старт проекта
                    </span>
                  </div>

                  <Input
                    value={assignmentForm.name}
                    onChange={(event) => updateAssignmentField('name', event.target.value)}
                    placeholder="Название проекта"
                    className="h-11 rounded-2xl border-white/10 bg-white/6 text-white placeholder:text-white/35 focus-visible:border-blue-400/50 focus-visible:ring-blue-400/20"
                  />

                  <div className="grid gap-3 sm:grid-cols-2">
                    <Select
                      value={assignmentForm.service}
                      onValueChange={(value) => updateAssignmentField('service', value)}
                    >
                      <SelectTrigger className="h-11 rounded-2xl border-white/10 bg-white/6 text-left text-white focus-visible:border-blue-400/50 focus-visible:ring-blue-400/20">
                        <SelectValue placeholder="Выберите услугу с сайта" />
                      </SelectTrigger>
                      <SelectContent className="max-h-96 rounded-2xl border-white/10 bg-[#050816] text-white">
                        {serviceCategories.map((category) => (
                          <SelectGroup key={category.id}>
                            <SelectLabel className="px-2 py-2 text-[11px] uppercase tracking-[0.24em] text-white/45">
                              {category.title}
                            </SelectLabel>
                            {category.offers.map((offer) => (
                              <SelectItem
                                key={offer.id}
                                value={offer.title}
                                className="rounded-xl px-3 py-2 text-white/82 focus:bg-white/10 focus:text-white"
                              >
                                {offer.title}
                              </SelectItem>
                            ))}
                          </SelectGroup>
                        ))}
                      </SelectContent>
                    </Select>
                    <Input
                      value={assignmentForm.budget}
                      onChange={(event) => updateAssignmentField('budget', event.target.value)}
                      placeholder="Бюджет"
                      className="h-11 rounded-2xl border-white/10 bg-white/6 text-white placeholder:text-white/35 focus-visible:border-blue-400/50 focus-visible:ring-blue-400/20"
                    />
                  </div>

                  <Input
                    type="date"
                    value={assignmentForm.deadline}
                    onChange={(event) => updateAssignmentField('deadline', event.target.value)}
                    className="h-11 rounded-2xl border-white/10 bg-white/6 text-white placeholder:text-white/35 focus-visible:border-blue-400/50 focus-visible:ring-blue-400/20"
                  />

                  <Textarea
                    value={assignmentForm.brief}
                    onChange={(event) => updateAssignmentField('brief', event.target.value)}
                    placeholder="Коротко опишите, что назначаете клиенту"
                    className="min-h-28 rounded-[1.5rem] border-white/10 bg-white/6 px-4 py-3 text-white placeholder:text-white/35 focus-visible:border-blue-400/50 focus-visible:ring-blue-400/20"
                  />

                  <Button
                    type="submit"
                    className="h-11 w-full rounded-full bg-gradient-to-r from-emerald-400 via-cyan-400 to-blue-500 text-slate-950 hover:opacity-95"
                  >
                    <UserRound className="h-4 w-4" />
                    Назначить услугу и создать проект
                  </Button>
                </form>

                {selectedProject ? (
                  <>
                <div className="mt-5 rounded-[1.5rem] border border-white/10 bg-black/30 p-4">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <p className="text-xl font-semibold text-white">{selectedProject.name}</p>
                      <p className="mt-2 text-sm text-white/62">{selectedProject.brief}</p>
                    </div>
                    <div className="text-right text-sm text-white/65">
                      <p>{selectedClient.user.name}</p>
                      <p className="mt-1">Дедлайн: {formatPortalDate(selectedProject.deadline)}</p>
                    </div>
                  </div>

                  <div className="mt-4 grid gap-3 lg:grid-cols-[1fr_auto]">
                    <label className="flex items-start gap-3 rounded-[1.25rem] border border-white/10 bg-white/6 px-4 py-3">
                      <Checkbox
                        checked={selectedProject.status === 'Запущен'}
                        onCheckedChange={(checked) => handleCompletedChange(Boolean(checked))}
                        className="mt-0.5 border-white/20 bg-black/30 text-slate-950 data-[state=checked]:border-emerald-300 data-[state=checked]:bg-emerald-300"
                      />
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-white">Проект выполнен</p>
                        <p className="mt-1 text-sm leading-6 text-white/60">
                          Когда галка стоит, проект получает статус "Запущен" и 100% готовности.
                          Если снять её, проект вернётся в статус "В работе".
                        </p>
                      </div>
                    </label>

                    <Button
                      type="button"
                      onClick={handleDeleteProject}
                      className="h-auto min-h-14 rounded-[1.25rem] bg-gradient-to-r from-rose-500 to-red-600 px-5 py-3 text-white hover:opacity-95"
                    >
                      <Trash2 className="h-4 w-4" />
                      Удалить проект
                    </Button>
                  </div>
                </div>

                <div className="mt-4 max-h-[420px] space-y-3 overflow-y-auto rounded-[1.5rem] border border-white/10 bg-black/25 p-4">
                  {selectedMessages.map((message) => {
                    const isManagerMessage = message.author === 'manager';
                    const canReply = message.author !== 'system';
                    const canEdit = message.author !== 'system';
                    const canDelete = message.author === 'manager';

                    return (
                      <div
                        key={message.id}
                        className={`flex ${isManagerMessage ? 'justify-end' : 'justify-start'}`}
                      >
                        <div className="max-w-[92%]">
                          <div
                            className={`rounded-2xl px-4 py-3 text-sm leading-relaxed ${
                              isManagerMessage
                                ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white'
                                : message.author === 'system'
                                  ? 'border border-white/10 bg-white/6 text-white/70'
                                  : 'border border-cyan-400/15 bg-cyan-400/10 text-white/90'
                            }`}
                          >
                            <p className="mb-1 text-[11px] uppercase tracking-[0.14em] text-white/45">
                              {message.authorName}
                            </p>
                            {message.replyToText ? (
                              <div className="mb-2 rounded-xl border border-white/10 bg-black/20 px-3 py-2 text-[12px] text-white/72">
                                <p className="font-medium text-white/78">
                                  {message.replyToAuthorName ?? 'Сообщение'}
                                </p>
                                <p className="mt-1 break-words">{message.replyToText}</p>
                              </div>
                            ) : null}
                            <p className="break-words">{message.text}</p>
                            {message.editedAt ? (
                              <p className="mt-2 text-[11px] text-white/52">
                                Изменено администратором
                              </p>
                            ) : null}
                          </div>

                          <div
                            className={`mt-1 flex flex-wrap gap-1 ${
                              isManagerMessage ? 'justify-end' : 'justify-start'
                            }`}
                          >
                            {canReply ? (
                              <button
                                type="button"
                                onClick={() => handleReplyMessage(message)}
                                className={messageActionButtonClassName}
                              >
                                <Reply className="h-3 w-3" />
                                Ответить
                              </button>
                            ) : null}
                            {canEdit ? (
                              <button
                                type="button"
                                onClick={() => handleStartEditingMessage(message)}
                                className={messageActionButtonClassName}
                              >
                                <Pencil className="h-3 w-3" />
                                Изменить
                              </button>
                            ) : null}
                            <button
                              type="button"
                              onClick={() => handleCopyMessage(message)}
                              className={messageActionButtonClassName}
                            >
                              <Copy className="h-3 w-3" />
                              Копировать
                            </button>
                            {canDelete ? (
                              <button
                                type="button"
                                onClick={() => handleDeleteMessage(message)}
                                className={messageActionButtonClassName}
                              >
                                <Trash2 className="h-3 w-3" />
                                Удалить
                              </button>
                            ) : null}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>

                <form onSubmit={handleSubmit} className="mt-4 space-y-3">
                  {editingMessage ? (
                    <div className="flex items-start justify-between gap-3 rounded-[1.5rem] border border-amber-400/18 bg-amber-400/10 px-4 py-3">
                      <div className="min-w-0">
                        <p className="text-[11px] uppercase tracking-[0.14em] text-amber-100/78">
                          Редактирование сообщения {editingMessage.authorName}
                        </p>
                        <p className="mt-1 break-words text-sm text-white/78">
                          {editingMessage.text}
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          setEditingMessage(null);
                          setMessageText('');
                        }}
                        className="rounded-full p-1 text-white/70 transition-colors hover:bg-white/10 hover:text-white"
                        aria-label="Отменить редактирование"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  ) : null}
                  {replyToMessage ? (
                    <div className="flex items-start justify-between gap-3 rounded-[1.5rem] border border-cyan-400/18 bg-cyan-400/10 px-4 py-3">
                      <div className="min-w-0">
                        <p className="text-[11px] uppercase tracking-[0.14em] text-cyan-100/78">
                          Ответ на сообщение {replyToMessage.authorName}
                        </p>
                        <p className="mt-1 break-words text-sm text-white/78">
                          {replyToMessage.text}
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => setReplyToMessage(null)}
                        className="rounded-full p-1 text-white/70 transition-colors hover:bg-white/10 hover:text-white"
                        aria-label="Отменить ответ"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  ) : null}
                  <Textarea
                    value={messageText}
                    onChange={(event) => setMessageText(event.target.value)}
                    placeholder={
                      editingMessage
                        ? 'Изменить текст выбранного сообщения...'
                        : 'Ответить клиенту по выбранному проекту...'
                    }
                    className="min-h-28 rounded-[1.5rem] border-white/10 bg-white/6 px-4 py-3 text-white placeholder:text-white/35 focus-visible:border-blue-400/50 focus-visible:ring-blue-400/20"
                  />
                  <Button
                    type="submit"
                    className="h-11 w-full rounded-full bg-gradient-to-r from-purple-600 via-blue-500 to-cyan-400 text-white hover:opacity-95"
                  >
                    {editingMessage ? 'Сохранить изменения сообщения' : 'Отправить ответ в чат'}
                  </Button>
                </form>
                  </>
                ) : (
                  <div className="mt-4 rounded-[1.5rem] border border-dashed border-white/12 bg-black/25 p-8 text-center text-white/55">
                    У клиента пока нет проектов. Сначала назначьте ему услугу и создайте первую карточку.
                  </div>
                )}
              </>
            ) : (
              <div className="mt-5 rounded-[1.5rem] border border-dashed border-white/12 bg-black/25 p-8 text-center text-white/55">
                Выберите клиента, чтобы назначить услугу или открыть чат по проекту.
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
