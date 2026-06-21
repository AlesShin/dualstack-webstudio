import { motion } from 'motion/react';
import { ExternalLink, Filter } from 'lucide-react';
import { useMemo, useState } from 'react';
import { ImageWithFallback } from './figma/ImageWithFallback';
import { ProjectModal } from './ProjectModal';

const projects = [
  {
    title: 'E-commerce платформа',
    category: 'Интернет-магазин',
    image: 'https://images.unsplash.com/photo-1622131815526-eaae1e615381?auto=format&fit=crop&q=80&w=1080',
    gradient: 'from-cyan-600 to-blue-600',
    description: 'Полнофункциональная платформа интернет-магазина с каталогом, оплатой, управлением заказами и личным кабинетом покупателя.',
    technologies: ['React', 'Node.js', 'PostgreSQL', 'Stripe'],
    timeline: '4 месяца',
    result: '+37% к повторным заказам',
    features: ['Каталог с фильтрами', 'Оплата и статусы заказов', 'Личный кабинет клиента', 'Интеграция с CRM'],
  },
  {
    title: 'Корпоративный сайт',
    category: 'B2B решение',
    image: 'https://images.unsplash.com/photo-1552664730-d307ca884978?auto=format&fit=crop&q=80&w=1080',
    gradient: 'from-emerald-600 to-cyan-600',
    description: 'Представительский сайт для B2B-компании: структура услуг, кейсы, лид-формы и база для дальнейшего SEO-продвижения.',
    technologies: ['Next.js', 'TypeScript', 'Sanity CMS', 'Tailwind'],
    timeline: '3 месяца',
    result: '2.4x рост заявок',
    features: ['Многостраничная структура', 'CMS для команды', 'SEO-ready архитектура', 'Интеграция с аналитикой'],
  },
  {
    title: 'SaaS приложение',
    category: 'Стартап',
    image: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&q=80&w=1080',
    gradient: 'from-violet-600 to-indigo-600',
    description: 'Облачное SaaS-решение для автоматизации процессов: дашборды, роли пользователей, уведомления и API для интеграций.',
    technologies: ['React', 'GraphQL', 'AWS', 'MongoDB'],
    timeline: '6 месяцев',
    result: 'MVP запущен за 12 недель',
    features: ['Роли и доступы', 'Дашборды KPI', 'REST/GraphQL API', 'Сценарии онбординга'],
  },
  {
    title: 'Landing для сервиса',
    category: 'Landing page',
    image: 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&q=80&w=1080',
    gradient: 'from-amber-500 to-rose-600',
    description: 'Продающий лендинг с сильным первым экраном, блоками доверия, тарифами и быстрым захватом заявки.',
    technologies: ['React', 'Vite', 'Tailwind', 'Motion'],
    timeline: '18 дней',
    result: '+52% к конверсии формы',
    features: ['Продающая структура', 'Адаптивные CTA', 'Быстрая загрузка', 'A/B-ready секции'],
  },
  {
    title: 'Сайт для образовательного проекта',
    category: 'Образование',
    image: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&q=80&w=1080',
    gradient: 'from-sky-600 to-teal-600',
    description: 'Информационный сайт образовательного проекта с программами обучения, преимуществами, отзывами и формой записи на консультацию.',
    technologies: ['React', 'TypeScript', 'Tailwind', 'Analytics'],
    timeline: '4 недели',
    result: '+41% заявок на обучение',
    features: ['Каталог программ', 'Страницы направлений', 'Отзывы выпускников', 'Форма записи'],
  },
  {
    title: 'Редизайн бренда',
    category: 'Брендинг',
    image: 'https://images.unsplash.com/photo-1542744173-8e7e53415bb0?auto=format&fit=crop&q=80&w=1080',
    gradient: 'from-fuchsia-600 to-orange-500',
    description: 'Обновление визуальной системы, tone of voice и digital-носителей для компании, которой нужен более современный образ.',
    technologies: ['Brand strategy', 'Figma', 'Design system', 'Guidelines'],
    timeline: '7 недель',
    result: 'единый стиль для 12 носителей',
    features: ['Платформа бренда', 'Айдентика', 'UI-набор', 'Гайдлайн для команды'],
  },
];

const filters = ['Все', ...Array.from(new Set(projects.map((project) => project.category)))];

export function Portfolio() {
  const [selectedProject, setSelectedProject] = useState<(typeof projects)[0] | null>(null);
  const [activeFilter, setActiveFilter] = useState('Все');

  const visibleProjects = useMemo(
    () =>
      activeFilter === 'Все'
        ? projects
        : projects.filter((project) => project.category === activeFilter),
    [activeFilter],
  );

  return (
    <section id="портфолио" className="relative overflow-hidden bg-gradient-to-b from-black via-gray-950 to-black py-16 sm:py-24 md:py-32 scroll-mt-20">
      <div className="content-shell">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="mb-8 flex flex-col gap-5 sm:mb-10 md:mb-12 lg:flex-row lg:items-end lg:justify-between"
        >
          <div className="max-w-3xl">
            <p className="mb-3 inline-flex items-center gap-2 rounded-full border border-white/12 bg-white/5 px-3 py-1.5 text-sm text-white/70">
              <Filter className="h-4 w-4 text-cyan-300" />
              Кейсы и результаты
            </p>
            <h2 className="mb-4 text-3xl font-bold text-white sm:text-4xl md:text-5xl lg:text-6xl">
              Наши проекты и <span className="bg-gradient-to-r from-cyan-300 to-amber-200 bg-clip-text text-transparent">результаты</span>
            </h2>
            <p className="max-w-2xl text-base text-white/62 sm:text-lg md:text-xl">
              Показываем не только красивые экраны, но и что именно было собрано: структура, функции, сроки и измеримый результат.
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            {filters.map((filter) => (
              <button
                key={filter}
                type="button"
                onClick={() => setActiveFilter(filter)}
                className={`rounded-lg border px-3 py-2 text-sm transition-colors ${
                  activeFilter === filter
                    ? 'border-cyan-300/50 bg-cyan-300 text-black'
                    : 'border-white/12 bg-white/5 text-white/76 hover:border-white/28 hover:text-white'
                }`}
              >
                {filter}
              </button>
            ))}
          </div>
        </motion.div>

        <div className="grid grid-cols-1 gap-4 sm:gap-5 md:grid-cols-2 xl:grid-cols-3">
          {visibleProjects.map((project, index) => (
            <motion.article
              key={project.title}
              initial={{ opacity: 0, y: 36 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.45, delay: index * 0.06 }}
              onClick={() => setSelectedProject(project)}
              className="group relative min-h-[28rem] cursor-pointer overflow-hidden rounded-lg border border-white/10 bg-white/[0.03] transform-gpu will-change-transform"
            >
              <ImageWithFallback
                src={project.image}
                alt={project.title}
                className="absolute inset-0 h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
              />
              <div className={`absolute inset-0 bg-gradient-to-t ${project.gradient} opacity-70 transition-opacity duration-500 group-hover:opacity-80`} />
              <div className="absolute inset-0 bg-gradient-to-t from-black via-black/35 to-black/10" />

              <div className="relative flex h-full min-h-[28rem] flex-col justify-between p-5 sm:p-6">
                <div className="flex items-center justify-between gap-3">
                  <span className="rounded-full border border-white/18 bg-black/30 px-3 py-1 text-xs text-white/82">
                    {project.category}
                  </span>
                  <span className="rounded-full border border-white/18 bg-white/12 px-3 py-1 text-xs text-white">
                    {project.result}
                  </span>
                </div>

                <div>
                  <h3 className="mb-3 text-2xl font-bold text-white sm:text-3xl">{project.title}</h3>
                  <p className="mb-5 line-clamp-3 text-sm leading-relaxed text-white/76 sm:text-base">
                    {project.description}
                  </p>

                  <button
                    type="button"
                    onClick={(event) => {
                      event.stopPropagation();
                      setSelectedProject(project);
                    }}
                    className="inline-flex items-center gap-2 rounded-lg bg-white px-4 py-2 text-sm font-medium text-black transition-transform hover:scale-[1.03] active:scale-95"
                  >
                    Смотреть кейс
                    <ExternalLink className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </motion.article>
          ))}
        </div>
      </div>

      <ProjectModal
        project={selectedProject}
        onClose={() => setSelectedProject(null)}
      />
    </section>
  );
}
