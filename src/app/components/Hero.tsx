import { motion, useReducedMotion } from 'motion/react';
import { ArrowRight, Sparkles } from 'lucide-react';

export function Hero() {
  const prefersReducedMotion = useReducedMotion();

  return (
    <section className="relative flex min-h-[100svh] items-center justify-center overflow-hidden bg-gradient-to-br from-purple-900 via-blue-900 to-black pb-10 pt-24 md:min-h-screen md:pb-14 md:pt-20 lg:pt-24">
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden">
        <motion.div
          className="hidden md:block absolute top-10 md:top-20 left-10 md:left-20 w-48 md:w-72 h-48 md:h-72 bg-purple-500/30 rounded-full blur-3xl"
          animate={prefersReducedMotion ? undefined : {
            scale: [1, 1.2, 1],
            x: [0, 50, 0],
            y: [0, 30, 0],
          }}
          transition={prefersReducedMotion ? undefined : {
            duration: 8,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
        />
        <motion.div
          className="hidden md:block absolute bottom-10 md:bottom-20 right-10 md:right-20 w-64 md:w-96 h-64 md:h-96 bg-blue-500/30 rounded-full blur-3xl"
          animate={prefersReducedMotion ? undefined : {
            scale: [1, 1.3, 1],
            x: [0, -50, 0],
            y: [0, -30, 0],
          }}
          transition={prefersReducedMotion ? undefined : {
            duration: 10,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
        />
        <motion.div
          className="hidden lg:block absolute top-1/2 left-1/2 w-48 md:w-64 h-48 md:h-64 bg-pink-500/20 rounded-full blur-3xl"
          animate={prefersReducedMotion ? undefined : {
            scale: [1, 1.5, 1],
            rotate: [0, 360],
          }}
          transition={prefersReducedMotion ? undefined : {
            duration: 12,
            repeat: Infinity,
            ease: 'linear',
          }}
        />
      </div>

      {/* Grid pattern overlay */}
      <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGRlZnM+PHBhdHRlcm4gaWQ9ImdyaWQiIHdpZHRoPSI2MCIgaGVpZ2h0PSI2MCIgcGF0dGVyblVuaXRzPSJ1c2VyU3BhY2VPblVzZSI+PHBhdGggZD0iTSAxMCAwIEwgMCAwIDAgMTAiIGZpbGw9Im5vbmUiIHN0cm9rZT0id2hpdGUiIHN0cm9rZS1vcGFjaXR5PSIwLjAzIiBzdHJva2Utd2lkdGg9IjEiLz48L3BhdHRlcm4+PC9kZWZzPjxyZWN0IHdpZHRoPSIxMDAlIiBoZWlnaHQ9IjEwMCUiIGZpbGw9InVybCgjZ3JpZCkiLz48L3N2Zz4=')] opacity-40" />

      {/* Content */}
      <div className="content-shell relative z-10 text-center">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="inline-flex items-center gap-2 px-3 sm:px-4 py-2 bg-white/10 md:backdrop-blur-sm rounded-full border border-white/20 mb-6 sm:mb-8"
        >
          <Sparkles className="w-3 h-3 sm:w-4 sm:h-4 text-yellow-300" />
          <span className="text-xs sm:text-sm text-white/90">Создаём сайты будущего</span>
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="mb-4 px-2 text-[clamp(2.25rem,10vw,7.5rem)] font-bold leading-[0.95] text-white sm:mb-6"
        >
          Веб-студия
          <br />
          <span className="bg-gradient-to-r from-purple-400 via-pink-400 to-blue-400 bg-clip-text text-transparent">
            Нового Уровня
          </span>
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.4 }}
          className="mx-auto mb-8 max-w-4xl px-2 text-base leading-relaxed text-white/80 sm:mb-12 sm:text-lg md:text-xl lg:text-2xl"
        >
          Разрабатываем современные сайты, которые впечатляют с первого взгляда
          и превращают посетителей в клиентов
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.6 }}
          className="flex flex-col items-center justify-center gap-3 px-2 sm:flex-row sm:gap-4"
        >
          <button 
            onClick={() => {
              document.getElementById('контакты')?.scrollIntoView({ behavior: 'smooth' });
            }}
            className="group flex w-full items-center justify-center gap-2 rounded-full bg-gradient-to-r from-purple-600 to-blue-600 px-6 py-3 text-white shadow-lg shadow-purple-500/50 transition-transform duration-300 hover:scale-[1.03] sm:w-auto sm:px-8 sm:py-4 transform-gpu will-change-transform"
          >
            Начать проект
            <ArrowRight className="w-4 h-4 sm:w-5 sm:h-5 group-hover:translate-x-1 transition-transform" />
          </button>
          <button 
            onClick={() => {
              document.getElementById('портфолио')?.scrollIntoView({ behavior: 'smooth' });
            }}
            className="w-full rounded-full border border-white/20 bg-white/10 px-6 py-3 text-white transition-colors duration-300 hover:bg-white/20 sm:w-auto sm:px-8 sm:py-4"
          >
            Наше портфолио
          </button>
        </motion.div>

        {/* Floating stats */}
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.8 }}
          className="mx-auto mt-12 grid max-w-4xl grid-cols-1 gap-4 px-2 sm:mt-20 sm:grid-cols-3 sm:gap-6 md:mt-24 md:gap-8"
        >
          {[
            { number: '500+', label: 'Проектов' },
            { number: '98%', label: 'Довольных клиентов' },
            { number: '24/7', label: 'Поддержка' },
          ].map((stat, index) => (
            <motion.div
              key={index}
              whileHover={{ scale: 1.05 }}
              className="p-4 sm:p-6 bg-white/5 md:backdrop-blur-sm rounded-2xl border border-white/10 transform-gpu will-change-transform"
            >
              <div className="text-2xl sm:text-3xl md:text-4xl font-bold text-white mb-2">{stat.number}</div>
              <div className="text-sm sm:text-base text-white/60">{stat.label}</div>
            </motion.div>
          ))}
        </motion.div>
      </div>

    </section>
  );
}
