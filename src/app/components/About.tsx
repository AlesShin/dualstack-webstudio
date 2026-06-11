import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import { Award, Users, Target, TrendingUp, X } from 'lucide-react';
import { useState } from 'react';

const stats = [
  { icon: Award, value: '7+', label: 'Лет опыта' },
  { icon: Users, value: '50+', label: 'Специалистов' },
  { icon: Target, value: '500+', label: 'Проектов' },
  { icon: TrendingUp, value: '98%', label: 'Успешных запусков' },
];

const aboutNarrative = {
  eyebrow: 'Digital-партнёр для роста',
  title: 'DualStack помогает бизнесу превращать идеи в сильные digital-решения',
  paragraphs: [
    'Мы не ограничиваемся красивой упаковкой. Для нас каждый проект начинается с понимания бизнеса: что именно нужно усилить, где теряются заявки, как пользователь принимает решение и какой цифровой инструмент действительно даст результат.',
    'В команде DualStack соединяются стратегия, дизайн, разработка и продвижение. Благодаря этому мы можем не просто собрать сайт или отдельную услугу, а выстроить цельную систему: от первого контакта с брендом до понятного пути клиента и роста конверсии.',
    'Нам важно, чтобы продукт был не только визуально сильным, но и удобным, быстрым, понятным в поддержке и полезным для бизнеса в долгую. Поэтому мы работаем в диалоге с клиентом, объясняем решения, держим фокус на целях и остаёмся рядом после запуска.',
  ],
  principles: [
    'Погружаемся в задачу бизнеса, а не работаем по шаблону.',
    'Собираем решения, которые реально можно запускать и масштабировать.',
    'Думаем не только о дизайне, но и о заявках, трафике и удобстве пользователя.',
    'Остаёмся на связи после релиза и помогаем развивать проект дальше.',
  ],
};

export function About() {
  const prefersReducedMotion = useReducedMotion();
  const [isAboutOpen, setIsAboutOpen] = useState(false);

  return (
    <>
      <section id="о-нас" className="relative overflow-hidden bg-gradient-to-b from-black via-purple-950/10 to-black py-16 sm:py-24 md:py-32 scroll-mt-20">
        <div className="content-shell">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-center mb-12 sm:mb-16 md:mb-20"
          >
            <h2 className="mb-4 px-2 text-3xl font-bold text-white sm:mb-6 sm:text-4xl md:text-5xl lg:text-6xl">
              О <span className="bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">Нас</span>
            </h2>
            <p className="mx-auto max-w-3xl px-2 text-base text-white/60 sm:text-lg md:text-xl">
              Мы - команда профессионалов, создающая цифровые продукты, которые меняют бизнес к лучшему
            </p>
          </motion.div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 sm:gap-12 md:gap-16 mb-16 sm:mb-20">
            {/* Text Content */}
            <motion.div
              initial={{ opacity: 0, x: -50 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              className="space-y-4 sm:space-y-6"
            >
              <h3 className="text-2xl sm:text-3xl font-bold text-white">
                Превращаем идеи в успешные digital-продукты
              </h3>
              <p className="text-sm sm:text-base text-white/70 leading-relaxed">
                С 2018 года мы помогаем бизнесу выходить в онлайн и масштабироваться.
                Наша команда состоит из опытных дизайнеров, разработчиков и маркетологов,
                которые знают, как создать продукт, решающий реальные задачи пользователей.
              </p>
              <p className="text-sm sm:text-base text-white/70 leading-relaxed">
                Мы не просто делаем сайты - мы создаём инструменты для роста вашего бизнеса.
                Каждый проект для нас уникален, и мы подходим к нему с полной отдачей и
                вниманием к деталям.
              </p>
              <div className="pt-4">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setIsAboutOpen(true)}
                  className="w-full rounded-full bg-gradient-to-r from-purple-600 to-blue-600 px-6 py-3 text-sm text-white transition-transform hover:scale-[1.03] sm:w-auto sm:px-8 sm:py-4 sm:text-base transform-gpu will-change-transform"
                >
                  Узнать больше
                </motion.button>
              </div>
            </motion.div>

            {/* Image/Visual */}
            <motion.div
              initial={{ opacity: 0, x: 50 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              className="relative"
            >
              <div className="relative rounded-2xl sm:rounded-3xl overflow-hidden aspect-square">
                <div className="absolute inset-0 bg-gradient-to-br from-purple-600/30 to-blue-600/30 md:backdrop-blur-sm border border-white/10" />
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="text-center p-6 sm:p-8">
                    <div className="text-5xl sm:text-6xl md:text-7xl font-bold bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent mb-4">
                      500+
                    </div>
                    <p className="text-lg sm:text-xl text-white/80">Успешных проектов</p>
                  </div>
                </div>
                {/* Decorative elements */}
                <motion.div
                  className="hidden md:block absolute top-10 right-10 w-20 h-20 bg-purple-500/20 rounded-full blur-2xl"
                  animate={prefersReducedMotion ? undefined : {
                    scale: [1, 1.2, 1],
                    opacity: [0.3, 0.6, 0.3],
                  }}
                  transition={prefersReducedMotion ? undefined : {
                    duration: 4,
                    repeat: Infinity,
                  }}
                />
                <motion.div
                  className="hidden md:block absolute bottom-10 left-10 w-32 h-32 bg-blue-500/20 rounded-full blur-2xl"
                  animate={prefersReducedMotion ? undefined : {
                    scale: [1, 1.3, 1],
                    opacity: [0.3, 0.6, 0.3],
                  }}
                  transition={prefersReducedMotion ? undefined : {
                    duration: 5,
                    repeat: Infinity,
                  }}
                />
              </div>
            </motion.div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 md:gap-8">
            {stats.map((stat, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                whileHover={{ y: -5 }}
                className="p-6 sm:p-8 bg-white/5 md:backdrop-blur-sm rounded-2xl sm:rounded-3xl border border-white/10 text-center transform-gpu will-change-transform"
              >
                <div className="w-12 h-12 sm:w-16 sm:h-16 mx-auto mb-3 sm:mb-4 rounded-xl sm:rounded-2xl bg-gradient-to-r from-purple-600 to-blue-600 flex items-center justify-center">
                  <stat.icon className="w-6 h-6 sm:w-8 sm:h-8 text-white" />
                </div>
                <div className="text-2xl sm:text-3xl md:text-4xl font-bold text-white mb-2">
                  {stat.value}
                </div>
                <div className="text-xs sm:text-sm text-white/60">{stat.label}</div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      <AnimatePresence>
        {isAboutOpen ? (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsAboutOpen(false)}
              className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm"
            />

            <div className="fixed inset-0 z-50 flex items-center justify-center p-3 pointer-events-none sm:p-4">
              <motion.div
                initial={{ opacity: 0, scale: 0.96, y: 18 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.96, y: 18 }}
                transition={{ duration: 0.35 }}
                onClick={(event) => event.stopPropagation()}
                className="pointer-events-auto relative w-full max-w-3xl max-h-[calc(100svh-1.5rem)] overflow-y-auto rounded-2xl border border-white/10 bg-[#050816] sm:max-h-[90vh] sm:rounded-3xl"
              >
                <button
                  onClick={() => setIsAboutOpen(false)}
                  className="absolute right-3 top-3 z-10 flex h-9 w-9 items-center justify-center rounded-full border border-white/10 bg-black/40 text-white transition-colors hover:bg-black/70 sm:right-4 sm:top-4 sm:h-10 sm:w-10"
                >
                  <X className="h-4 w-4 sm:h-5 sm:w-5" />
                </button>

                <div className="rounded-t-2xl bg-gradient-to-r from-purple-600/90 via-blue-600/80 to-cyan-500/75 p-6 pr-12 sm:rounded-t-3xl sm:p-8 sm:pr-14 md:p-10">
                  <p className="mb-2 text-sm uppercase tracking-[0.24em] text-white/70">
                    {aboutNarrative.eyebrow}
                  </p>
                  <h3 className="max-w-2xl text-2xl font-bold leading-tight text-white sm:text-4xl">
                    {aboutNarrative.title}
                  </h3>
                </div>

                <div className="space-y-8 p-6 sm:p-8 md:p-10">
                  <div className="space-y-4">
                    {aboutNarrative.paragraphs.map((paragraph) => (
                      <p key={paragraph} className="text-sm leading-7 text-white/75 sm:text-base">
                        {paragraph}
                      </p>
                    ))}
                  </div>

                  <div className="rounded-[1.75rem] border border-white/10 bg-white/5 p-5 sm:p-6">
                    <p className="mb-4 text-lg font-semibold text-white">Что для нас важно в каждом проекте</p>
                    <div className="grid gap-3 sm:grid-cols-2">
                      {aboutNarrative.principles.map((item) => (
                        <div
                          key={item}
                          className="rounded-2xl border border-white/10 bg-black/25 px-4 py-3 text-sm leading-6 text-white/76"
                        >
                          {item}
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="flex flex-col gap-3 sm:flex-row">
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => {
                        setIsAboutOpen(false);
                        document.getElementById('контакты')?.scrollIntoView({ behavior: 'smooth' });
                      }}
                      className="rounded-full bg-gradient-to-r from-purple-600 to-blue-600 px-6 py-3 text-sm text-white sm:px-8 sm:text-base"
                    >
                      Обсудить проект
                    </motion.button>
                    <button
                      type="button"
                      onClick={() => setIsAboutOpen(false)}
                      className="rounded-full border border-white/12 bg-white/6 px-6 py-3 text-sm text-white/80 transition-colors hover:bg-white/10 hover:text-white sm:px-8 sm:text-base"
                    >
                      Закрыть
                    </button>
                  </div>
                </div>
              </motion.div>
            </div>
          </>
        ) : null}
      </AnimatePresence>
    </>
  );
}
