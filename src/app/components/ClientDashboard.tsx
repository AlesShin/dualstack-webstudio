import { motion } from 'motion/react';
import {
  Bell,
  CalendarClock,
  FileText,
  FolderPlus,
  LayoutDashboard,
  MessageSquareMore,
  Search,
  Sparkles,
  Target,
} from 'lucide-react';
import { useState, type FormEvent } from 'react';
import { toast } from 'sonner';

import type { CreateProjectInput, PortalSession, ProjectStatus } from '../lib/clientPortal';
import { formatPortalDate } from '../lib/clientPortal';
import { Button } from './ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from './ui/dialog';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';

interface ClientDashboardProps {
  session: PortalSession;
  selectedProjectId: string | null;
  onSelectProject: (projectId: string) => void;
  onCreateProject: (input: CreateProjectInput) => void;
  onOpenChat: (projectId?: string) => void;
}

const statusOrder: Array<'all' | ProjectStatus> = [
  'all',
  'Новый запрос',
  'В брифе',
  'В работе',
  'На согласовании',
  'Запущен',
];

const createFieldClassName =
  'mt-2 rounded-2xl border-white/10 bg-white/6 px-4 text-sm text-white placeholder:text-white/35 focus-visible:border-blue-400/50 focus-visible:ring-blue-400/25';

function statusBadgeClassName(status: ProjectStatus) {
  switch (status) {
    case 'Запущен':
      return 'border-emerald-400/25 bg-emerald-400/12 text-emerald-100';
    case 'В работе':
      return 'border-cyan-400/25 bg-cyan-400/12 text-cyan-100';
    case 'На согласовании':
      return 'border-amber-400/25 bg-amber-400/12 text-amber-100';
    case 'Новый запрос':
      return 'border-violet-400/25 bg-violet-400/12 text-violet-100';
    default:
      return 'border-white/12 bg-white/6 text-white/75';
  }
}

export function ClientDashboard({
  session,
  selectedProjectId,
  onSelectProject,
  onCreateProject,
  onOpenChat,
}: ClientDashboardProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | ProjectStatus>('all');
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [formData, setFormData] = useState<CreateProjectInput>({
    name: '',
    service: 'Разработка сайта',
    deadline: '',
    budget: '',
    brief: '',
  });

  const projects = session.projects;
  const hasProjects = projects.length > 0;
  const selectedProject =
    projects.find((project) => project.id === selectedProjectId) ?? projects[0] ?? null;
  const totalUnread = projects.reduce((sum, project) => sum + project.unreadCount, 0);
  const activeProjects = projects.filter((project) => project.status !== 'Запущен').length;
  const averageProgress = Math.round(
    projects.reduce((sum, project) => sum + project.progress, 0) / Math.max(1, projects.length),
  );

  const filteredProjects = projects.filter((project) => {
    const matchesName = project.name.toLowerCase().includes(searchQuery.toLowerCase().trim());
    const matchesStatus = statusFilter === 'all' || project.status === statusFilter;
    return matchesName && matchesStatus;
  });

  const activityFeed = [...session.messages]
    .sort((left, right) => new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime())
    .slice(0, 5);

  function updateFormField<Key extends keyof CreateProjectInput>(field: Key, value: CreateProjectInput[Key]) {
    setFormData((prev) => ({ ...prev, [field]: value }));
  }

  function handleCreateProject(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!formData.name.trim() || !formData.brief.trim()) {
      toast.error('Нужно указать название проекта и короткий бриф');
      return;
    }

    onCreateProject(formData);
    setIsCreateOpen(false);
    setFormData({
      name: '',
      service: 'Разработка сайта',
      deadline: '',
      budget: '',
      brief: '',
    });
    toast.success('Проект добавлен в профиль');
  }

  return (
    <>
      <section id="кабинет-сводка" className="relative overflow-hidden bg-black pb-16 pt-28 sm:pb-20 sm:pt-32">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(59,130,246,0.18),transparent_28%),radial-gradient(circle_at_bottom_right,rgba(168,85,247,0.18),transparent_30%)]" />

        <div className="content-shell relative z-10 space-y-8">
          <div className="grid gap-4 lg:grid-cols-[1.5fr_1fr]">
            <motion.div
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              className="rounded-[2rem] border border-white/10 bg-white/6 p-6 shadow-2xl shadow-blue-950/20 backdrop-blur sm:p-8"
            >
              <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/6 px-3 py-1 text-xs uppercase tracking-[0.24em] text-white/55">
                <LayoutDashboard className="h-3.5 w-3.5" />
                Профиль клиента
              </div>

              <h1 className="mt-5 max-w-3xl text-3xl font-semibold leading-tight text-white sm:text-4xl lg:text-[2.8rem]">
                {session.user.name}, вы в кабинете проекта.
              </h1>
              <p className="mt-4 max-w-2xl text-sm leading-7 text-white/68 sm:text-base">
                {hasProjects
                  ? 'Здесь можно создавать новые проекты, искать их по названию, следить за статусами и держать переписку с менеджером в одном месте.'
                  : 'После регистрации кабинет открыт, а первую услугу и проект назначит администратор. Как только он это сделает, здесь появится карточка проекта и чат.'}
              </p>

              <div className="mt-6 flex flex-wrap gap-3">
                {hasProjects ? (
                  <>
                    <Button
                      type="button"
                      onClick={() => setIsCreateOpen(true)}
                      className="h-11 rounded-full bg-gradient-to-r from-purple-600 via-blue-500 to-cyan-400 px-5 text-white hover:opacity-95"
                    >
                      <FolderPlus className="h-4 w-4" />
                      Создать новый проект
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => onOpenChat(selectedProject?.id)}
                      className="h-11 rounded-full border-white/12 bg-white/6 px-5 text-white hover:bg-white/10"
                    >
                      <MessageSquareMore className="h-4 w-4" />
                      Открыть онлайн-чат
                    </Button>
                  </>
                ) : (
                  <div className="rounded-full border border-amber-400/18 bg-amber-400/10 px-4 py-3 text-sm text-amber-100/90">
                    {session.leadGoal?.trim()
                      ? `Запрос отправлен администратору: ${session.leadGoal}`
                      : 'Пока ждём назначения услуги от администратора.'}
                  </div>
                )}
              </div>
            </motion.div>

            <div className="grid gap-4 sm:grid-cols-3 lg:grid-cols-1">
              {[
                {
                  label: 'Активные проекты',
                  value: String(activeProjects),
                  note: 'в работе и на согласовании',
                  icon: Target,
                },
                {
                  label: 'Средний прогресс',
                  value: `${averageProgress}%`,
                  note: 'по всем карточкам в профиле',
                  icon: Sparkles,
                },
                {
                  label: 'Новые сообщения',
                  value: String(totalUnread),
                  note: 'в приватном онлайн-чате',
                  icon: Bell,
                },
              ].map(({ label, value, note, icon: Icon }) => (
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

          <div
            id="кабинет-проекты"
            className="rounded-[2rem] border border-white/10 bg-white/6 p-5 backdrop-blur sm:p-6"
          >
            {hasProjects ? (
              <>
                <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
                  <div>
                    <p className="text-lg font-semibold text-white">Проекты в работе</p>
                    <p className="mt-1 text-sm text-white/58">
                      Поиск проекта по названию, фильтрация по статусу и быстрый переход в чат.
                    </p>
                  </div>

                  <div className="flex flex-col gap-3 md:flex-row">
                    <div className="relative min-w-[18rem]">
                      <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-white/40">
                        <Search className="h-4 w-4" />
                      </span>
                      <Input
                        value={searchQuery}
                        onChange={(event) => setSearchQuery(event.target.value)}
                        placeholder="Поиск проекта по названию"
                        aria-label="Поиск проекта по названию"
                        className="h-11 w-full min-w-[18rem] rounded-full border-white/10 bg-white/6 pl-11 pr-4 text-white placeholder:text-white/35 focus-visible:border-blue-400/50 focus-visible:ring-blue-400/20"
                      />
                    </div>

                    <div className="flex flex-wrap gap-2">
                      {statusOrder.map((status) => (
                        <button
                          key={status}
                          type="button"
                          onClick={() => setStatusFilter(status)}
                          className={`rounded-full border px-4 py-2 text-sm transition-colors ${
                            statusFilter === status
                              ? 'border-cyan-400/35 bg-cyan-400/12 text-cyan-100'
                              : 'border-white/10 bg-white/6 text-white/70 hover:bg-white/10 hover:text-white'
                          }`}
                        >
                          {status === 'all' ? 'Все статусы' : status}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="mt-6 grid gap-4 lg:grid-cols-2 xl:grid-cols-3">
                  {filteredProjects.map((project) => {
                const isSelected = selectedProject?.id === project.id;

                return (
                  <motion.article
                    key={project.id}
                    initial={{ opacity: 0, y: 18 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={`rounded-[1.5rem] border p-5 transition-colors ${
                      isSelected
                        ? 'border-cyan-400/30 bg-cyan-400/10'
                        : 'border-white/10 bg-black/35 hover:border-white/18'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-xs uppercase tracking-[0.18em] text-white/45">
                          {project.service}
                        </p>
                        <h3 className="mt-2 text-xl font-semibold text-white">{project.name}</h3>
                      </div>
                      <span
                        className={`inline-flex rounded-full border px-3 py-1 text-xs ${statusBadgeClassName(project.status)}`}
                      >
                        {project.status}
                      </span>
                    </div>

                    <p className="mt-4 text-sm leading-6 text-white/65">{project.brief}</p>

                    <div className="mt-5">
                      <div className="flex items-center justify-between text-sm text-white/65">
                        <span>Готовность</span>
                        <span>{project.progress}%</span>
                      </div>
                      <div className="mt-2 h-2 rounded-full bg-white/10">
                        <div
                          className="h-full rounded-full bg-gradient-to-r from-blue-500 to-cyan-400"
                          style={{ width: `${project.progress}%` }}
                        />
                      </div>
                    </div>

                    <div className="mt-5 grid gap-3 text-sm text-white/70">
                      <div className="flex items-center justify-between gap-3">
                        <span className="text-white/45">Дедлайн</span>
                        <span>{formatPortalDate(project.deadline)}</span>
                      </div>
                      <div className="flex items-center justify-between gap-3">
                        <span className="text-white/45">Бюджет</span>
                        <span>{project.budget}</span>
                      </div>
                      <div className="flex items-center justify-between gap-3">
                        <span className="text-white/45">Менеджер</span>
                        <span>{project.managerName}</span>
                      </div>
                    </div>

                    <div className="mt-5 rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white/62">
                      Следующий шаг: {project.nextStep}
                    </div>

                    <div className="mt-5 flex items-center justify-between gap-3">
                      <button
                        type="button"
                        onClick={() => onSelectProject(project.id)}
                        className="rounded-full border border-white/10 bg-white/6 px-4 py-2 text-sm text-white/80 transition-colors hover:bg-white/10 hover:text-white"
                      >
                        Выбрать
                      </button>
                      <div className="flex items-center gap-3">
                        {project.unreadCount > 0 && (
                          <span className="rounded-full bg-blue-500 px-2.5 py-1 text-xs text-white">
                            {project.unreadCount} новых
                          </span>
                        )}
                        <button
                          type="button"
                          onClick={() => onOpenChat(project.id)}
                          className="rounded-full bg-white px-4 py-2 text-sm text-slate-950 transition-colors hover:bg-slate-100"
                        >
                          Открыть чат
                        </button>
                      </div>
                    </div>
                  </motion.article>
                );
                  })}
                </div>

                {filteredProjects.length === 0 && (
                  <div className="mt-6 rounded-[1.5rem] border border-dashed border-white/12 bg-black/25 p-8 text-center text-white/55">
                    По этому названию ничего не найдено. Попробуйте другой запрос или создайте новый проект.
                  </div>
                )}
              </>
            ) : (
              <div className="rounded-[1.6rem] border border-dashed border-white/12 bg-black/25 p-8 text-center">
                <p className="text-xl font-semibold text-white">Панель пока пустая</p>
                <p className="mt-3 text-sm leading-7 text-white/58">
                  Администратор получил вашу регистрацию и сам назначит первую услугу.
                  После этого здесь появятся проект, статусы и переписка.
                </p>
                {session.leadGoal?.trim() && (
                  <div className="mx-auto mt-5 max-w-2xl rounded-2xl border border-amber-400/18 bg-amber-400/10 px-4 py-4 text-left text-sm text-amber-100/90">
                    Ваш запрос: {session.leadGoal}
                  </div>
                )}
              </div>
            )}
          </div>

          <div id="кабинет-активность" className="grid gap-4 xl:grid-cols-[1.35fr_1fr]">
            <div className="rounded-[1.8rem] border border-white/10 bg-white/6 p-6 backdrop-blur">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-lg font-semibold text-white">Активность и уведомления</p>
                  <p className="mt-1 text-sm text-white/58">
                    Последние события по проектам и сообщения от команды.
                  </p>
                </div>
                <Bell className="h-5 w-5 text-cyan-200" />
              </div>

              <div className="mt-5 space-y-3">
                {activityFeed.length > 0 ? activityFeed.map((item) => {
                  const project = projects.find((entry) => entry.id === item.projectId);

                  return (
                    <div
                      key={item.id}
                      className="rounded-2xl border border-white/10 bg-black/25 px-4 py-4"
                    >
                      <div className="flex items-center justify-between gap-3">
                        <p className="text-sm font-medium text-white">
                          {project?.name ?? 'Проект'} · {item.authorName}
                        </p>
                        <span className="text-xs text-white/40">
                          {formatPortalDate(item.createdAt, { day: 'numeric', month: 'short' })}
                        </span>
                      </div>
                      <p className="mt-2 text-sm leading-6 text-white/63">{item.text}</p>
                    </div>
                  );
                }) : (
                  <div className="rounded-2xl border border-dashed border-white/12 bg-black/25 px-4 py-5 text-sm text-white/55">
                    Пока здесь пусто. Как только администратор назначит услугу или напишет в проект,
                    активность появится в этом блоке.
                  </div>
                )}
              </div>
            </div>

            <div className="space-y-4">
              <div className="rounded-[1.8rem] border border-white/10 bg-white/6 p-6 backdrop-blur">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-lg font-semibold text-white">Выбранный проект</p>
                    <p className="mt-1 text-sm text-white/58">
                      Быстрые ориентиры по текущей карточке.
                    </p>
                  </div>
                  <CalendarClock className="h-5 w-5 text-cyan-200" />
                </div>

                {selectedProject ? (
                  <div className="mt-5 space-y-4">
                    <div>
                      <p className="text-xl font-semibold text-white">{selectedProject.name}</p>
                      <p className="mt-2 text-sm text-white/62">{selectedProject.brief}</p>
                    </div>

                    <div className="rounded-2xl border border-white/10 bg-black/25 p-4 text-sm text-white/72">
                      Следующий созвон: {formatPortalDate(selectedProject.nextMeeting)}
                    </div>
                    <div className="rounded-2xl border border-white/10 bg-black/25 p-4 text-sm text-white/72">
                      Ближайшая задача: {selectedProject.nextStep}
                    </div>

                    <Button
                      type="button"
                      onClick={() => onOpenChat(selectedProject.id)}
                      className="h-11 w-full rounded-full bg-gradient-to-r from-purple-600 to-blue-500 text-white hover:opacity-95"
                    >
                      Перейти в чат по проекту
                    </Button>
                  </div>
                ) : (
                  <div className="mt-5 rounded-2xl border border-dashed border-white/12 bg-black/25 p-4 text-sm text-white/55">
                    Пока нет выбранного проекта.
                  </div>
                )}
              </div>

              <div className="rounded-[1.8rem] border border-white/10 bg-white/6 p-6 backdrop-blur">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-lg font-semibold text-white">Документы и бонусы</p>
                    <p className="mt-1 text-sm text-white/58">
                      Ещё пара полезных штук внутри профиля.
                    </p>
                  </div>
                  <FileText className="h-5 w-5 text-cyan-200" />
                </div>

                <div className="mt-5 space-y-3">
                  {[
                    'Бриф клиента уже закреплён в карточке проекта',
                    'Финальная смета обновляется после каждого нового запроса',
                    'Созвон и чат держатся в одной зоне, без потери контекста',
                  ].map((item) => (
                    <div
                      key={item}
                      className="rounded-2xl border border-white/10 bg-black/25 px-4 py-3 text-sm text-white/70"
                    >
                      {item}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <DialogContent className="border border-white/10 bg-[#050816]/95 text-white shadow-2xl shadow-blue-950/25 backdrop-blur-xl sm:max-w-[38rem]">
          <DialogHeader className="text-left">
            <DialogTitle className="text-2xl text-white">Новый проект</DialogTitle>
            <DialogDescription className="text-sm leading-6 text-white/60">
              Добавьте новый проект прямо из профиля. Он сразу появится в списке и в онлайн-чате.
            </DialogDescription>
          </DialogHeader>

          <form className="space-y-4" onSubmit={handleCreateProject}>
            <div>
              <Label htmlFor="project-name" className="text-sm text-white/80">
                Название проекта
              </Label>
              <Input
                id="project-name"
                value={formData.name}
                onChange={(event) => updateFormField('name', event.target.value)}
                placeholder="Например: сайт для новой линейки услуг"
                className={`${createFieldClassName} h-11`}
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <Label htmlFor="project-service" className="text-sm text-white/80">
                  Направление
                </Label>
                <Input
                  id="project-service"
                  value={formData.service}
                  onChange={(event) => updateFormField('service', event.target.value)}
                  placeholder="Разработка сайта"
                  className={`${createFieldClassName} h-11`}
                />
              </div>

              <div>
                <Label htmlFor="project-budget" className="text-sm text-white/80">
                  Бюджет
                </Label>
                <Input
                  id="project-budget"
                  value={formData.budget}
                  onChange={(event) => updateFormField('budget', event.target.value)}
                  placeholder="Например: 120 000 ₽"
                  className={`${createFieldClassName} h-11`}
                />
              </div>
            </div>

            <div>
              <Label htmlFor="project-deadline" className="text-sm text-white/80">
                Дедлайн
              </Label>
              <Input
                id="project-deadline"
                type="date"
                value={formData.deadline}
                onChange={(event) => updateFormField('deadline', event.target.value)}
                className={`${createFieldClassName} h-11`}
              />
            </div>

            <div>
              <Label htmlFor="project-brief" className="text-sm text-white/80">
                Краткий бриф
              </Label>
              <Textarea
                id="project-brief"
                value={formData.brief}
                onChange={(event) => updateFormField('brief', event.target.value)}
                placeholder="Опишите цель, важные страницы, интеграции или другие пожелания"
                className={`${createFieldClassName} min-h-32 py-3`}
              />
            </div>

            <Button
              type="submit"
              className="h-11 w-full rounded-full bg-gradient-to-r from-purple-600 via-blue-500 to-cyan-400 text-white hover:opacity-95"
            >
              <FolderPlus className="h-4 w-4" />
              Создать и открыть в профиле
            </Button>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
