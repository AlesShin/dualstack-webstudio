import { motion, useReducedMotion } from 'motion/react';
import { ArrowRight, CheckCircle2, MousePointerClick, ShieldCheck, Sparkles } from 'lucide-react';

const heroMetrics = [
  { number: '10-21', label: 'дней до первого релиза' },
  { number: '98%', label: 'проектов с адаптивом без переделок' },
  { number: '24/7', label: 'заявки и поддержка в кабинете' },
];

const heroBenefits = [
  { icon: MousePointerClick, label: 'Продуманная структура под заявки' },
  { icon: ShieldCheck, label: 'Личный кабинет клиента и админа' },
  { icon: CheckCircle2, label: 'SEO, аналитика и быстрый запуск' },
];

export function Hero() {
  const prefersReducedMotion = useReducedMotion();

  return (
    <section id="top" className="relative flex min-h-[100svh] items-center overflow-hidden bg-black pb-10 pt-24 md:min-h-screen md:pb-14 md:pt-20 lg:pt-24">
      <img
        src="https://images.unsplash.com/photo-1497366811353-6870744d04b2?auto=format&fit=crop&q=85&w=2200"
        alt=""
        aria-hidden="true"
        className="absolute inset-0 h-full w-full object-cover opacity-40"
      />
      <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(0,0,0,0.92)_0%,rgba(0,0,0,0.72)_48%,rgba(0,0,0,0.42)_100%)]" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_72%_18%,rgba(34,211,238,0.22),transparent_30%),linear-gradient(180deg,transparent_72%,#000_100%)]" />
      <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjQiIGhlaWdodD0iNjQiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZyI+PGRlZnM+PHBhdHRlcm4gaWQ9ImdyaWQiIHdpZHRoPSI2NCIgaGVpZ2h0PSI2NCIgcGF0dGVyblVuaXRzPSJ1c2VyU3BhY2VPblVzZSI+PHBhdGggZD0iTSA2NCAwIEwgMCAwIDAgNjQiIGZpbGw9Im5vbmUiIHN0cm9rZT0id2hpdGUiIHN0cm9rZS1vcGFjaXR5PSIwLjA2IiBzdHJva2Utd2lkdGg9IjEiLz48L3BhdHRlcm4+PC9kZWZzPjxyZWN0IHdpZHRoPSIxMDAlIiBoZWlnaHQ9IjEwMCUiIGZpbGw9InVybCgjZ3JpZCkiLz48L3N2Zz4=')] opacity-45" />

      <div className="content-shell relative z-10">
      
        <motion.h1
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="mb-5 max-w-5xl text-[clamp(2.45rem,8.2vw,6.75rem)] font-bold leading-[0.95] text-white sm:mb-6"
        >
          DualStack
          <br />
          <span className="bg-gradient-to-r from-cyan-300 via-white to-amber-200 bg-clip-text text-transparent">
            запускает сайты, которые продают
          </span>
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.4 }}
          className="mb-8 max-w-3xl text-base leading-relaxed text-white/78 sm:mb-10 sm:text-lg md:text-xl lg:text-2xl"
        >
          Проектируем лендинги, корпоративные сайты, интернет-магазины и личные кабинеты:
          с понятной структурой, заявками, аналитикой и сопровождением после запуска.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.6 }}
          className="flex flex-col gap-3 sm:flex-row sm:gap-4"
        >
          <button
            type="button"
            onClick={() => {
              document.getElementById('контакты')?.scrollIntoView({ behavior: 'smooth' });
            }}
            className="group flex w-full items-center justify-center gap-2 rounded-lg bg-cyan-400 px-6 py-3 font-medium text-black shadow-lg shadow-cyan-500/20 transition-transform duration-300 hover:scale-[1.03] sm:w-auto sm:px-8 sm:py-4 transform-gpu will-change-transform"
          >
            Начать проект
            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1 sm:h-5 sm:w-5" />
          </button>
          <button
            type="button"
            onClick={() => {
              document.getElementById('портфолио')?.scrollIntoView({ behavior: 'smooth' });
            }}
            className="w-full rounded-lg border border-white/20 bg-white/10 px-6 py-3 text-white transition-colors duration-300 hover:bg-white/20 sm:w-auto sm:px-8 sm:py-4"
          >
            Наше портфолио
          </button>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.7 }}
          className="mt-8 grid max-w-4xl gap-3 sm:grid-cols-3"
        >
          {heroBenefits.map((benefit) => (
            <div
              key={benefit.label}
              className="flex items-center gap-3 rounded-lg border border-white/12 bg-black/35 px-4 py-3 text-sm text-white/78"
            >
              <benefit.icon className="h-5 w-5 shrink-0 text-cyan-300" />
              <span>{benefit.label}</span>
            </div>
          ))}
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.8 }}
          className="mt-10 grid max-w-4xl grid-cols-1 gap-3 sm:mt-14 sm:grid-cols-3 sm:gap-4"
        >
          {heroMetrics.map((stat, index) => (
            <motion.div
              key={index}
              whileHover={prefersReducedMotion ? undefined : { y: -4 }}
              className="rounded-lg border border-white/10 bg-white/8 p-4 transform-gpu will-change-transform sm:p-5"
            >
              <div className="mb-2 text-2xl font-bold text-white sm:text-3xl md:text-4xl">
                {stat.number}
              </div>
              <div className="text-sm text-white/62 sm:text-base">{stat.label}</div>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
