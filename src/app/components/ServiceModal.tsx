import { motion, AnimatePresence } from 'motion/react';
import { X, Check } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

interface Service {
  icon: LucideIcon;
  title: string;
  description: string;
  color: string;
}

interface ServiceModalProps {
  service: Service | null;
  onClose: () => void;
}

const serviceDetails: Record<string, {
  fullDescription: string;
  features: string[];
  process: string[];
  price: string;
}> = {
  'Разработка сайтов': {
    fullDescription: 'Создаем современные, быстрые и масштабируемые веб-приложения с использованием передовых технологий. Наши решения отличаются высокой производительностью, безопасностью и удобством использования.',
    features: [
      'Адаптивный дизайн для всех устройств',
      'Оптимизация производительности',
      'Интеграция с API и внешними сервисами',
      'Система управления контентом',
      'Безопасность и защита данных',
      'Техническая документация',
    ],
    process: [
      'Анализ требований и планирование',
      'Проектирование архитектуры',
      'Разработка и тестирование',
      'Запуск и поддержка',
    ],
    price: 'от 150 000 ₽',
  },
  'Веб-дизайн': {
    fullDescription: 'Разрабатываем уникальный дизайн, который отражает индивидуальность вашего бренда и создает незабываемое впечатление на пользователей.',
    features: [
      'UX/UI исследования',
      'Создание прототипов',
      'Дизайн-система и гайдлайны',
      'Анимации и микроинтеракции',
      'Адаптация для разных устройств',
      'Исходники в Figma',
    ],
    process: [
      'Исследование аудитории',
      'Создание концепции',
      'Разработка прототипов',
      'Финальный дизайн',
    ],
    price: 'от 80 000 ₽',
  },
  'SEO оптимизация': {
    fullDescription: 'Комплексная SEO-оптимизация для вывода вашего сайта в топ поисковой выдачи. Увеличиваем органический трафик и конверсию.',
    features: [
      'Технический аудит сайта',
      'Оптимизация контента',
      'Улучшение структуры',
      'Работа со ссылочной массой',
      'Анализ конкурентов',
      'Ежемесячные отчеты',
    ],
    process: [
      'Аудит текущего состояния',
      'Разработка стратегии',
      'Оптимизация сайта',
      'Мониторинг результатов',
    ],
    price: 'от 50 000 ₽/мес',
  },
  'Мобильная адаптация': {
    fullDescription: 'Обеспечиваем идеальное отображение вашего сайта на всех типах устройств - от смартфонов до планшетов и десктопов.',
    features: [
      'Responsive дизайн',
      'Оптимизация для мобильных',
      'Touch-friendly интерфейс',
      'Тестирование на устройствах',
      'Улучшение скорости загрузки',
      'PWA функциональность',
    ],
    process: [
      'Анализ текущей адаптации',
      'Разработка решений',
      'Внедрение изменений',
      'Тестирование',
    ],
    price: 'от 40 000 ₽',
  },
  'Высокая скорость': {
    fullDescription: 'Оптимизируем производительность вашего сайта для мгновенной загрузки страниц и улучшения пользовательского опыта.',
    features: [
      'Оптимизация изображений',
      'Минификация кода',
      'Кэширование',
      'CDN настройка',
      'Lazy loading',
      'Core Web Vitals оптимизация',
    ],
    process: [
      'Аудит производительности',
      'Выявление узких мест',
      'Оптимизация',
      'Мониторинг метрик',
    ],
    price: 'от 35 000 ₽',
  },
  'Безопасность': {
    fullDescription: 'Обеспечиваем надежную защиту вашего сайта от взломов, вирусов и утечек данных с помощью современных методов безопасности.',
    features: [
      'SSL сертификаты',
      'Защита от DDoS',
      'Безопасность данных',
      'Регулярные обновления',
      'Резервное копирование',
      'Мониторинг угроз',
    ],
    process: [
      'Аудит безопасности',
      'Устранение уязвимостей',
      'Настройка защиты',
      'Постоянный мониторинг',
    ],
    price: 'от 30 000 ₽',
  },
};

export function ServiceModal({ service, onClose }: ServiceModalProps) {
  if (!service) return null;

  const details = serviceDetails[service.title];
  const Icon = service.icon;

  return (
    <AnimatePresence>
      {service && details && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50"
          />

          {/* Modal */}
          <div className="fixed inset-0 z-50 flex items-center justify-center p-3 pointer-events-none sm:p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              transition={{ type: 'spring', duration: 0.5 }}
              onClick={(e) => e.stopPropagation()}
              className="relative w-full max-w-4xl max-h-[calc(100svh-1.5rem)] overflow-y-auto rounded-2xl border border-white/10 bg-gray-900 pointer-events-auto sm:max-h-[90vh] sm:rounded-3xl"
            >
              {/* Close button */}
              <button
                onClick={onClose}
                className="absolute right-3 top-3 z-10 flex h-9 w-9 items-center justify-center rounded-full border border-white/10 bg-black/50 text-white transition-colors hover:bg-black/70 sm:right-4 sm:top-4 sm:h-10 sm:w-10"
              >
                <X className="h-4 w-4 sm:h-5 sm:w-5" />
              </button>

              {/* Header */}
              <div className={`relative rounded-t-2xl bg-gradient-to-r p-6 pr-12 sm:rounded-t-3xl sm:p-8 sm:pr-14 md:p-10 ${service.color}`}>
                <div className="mb-1 flex flex-col gap-3 sm:mb-4 sm:flex-row sm:items-center sm:gap-4">
                  <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white/20 backdrop-blur-sm sm:h-16 sm:w-16">
                    <Icon className="h-7 w-7 text-white sm:h-8 sm:w-8" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-white sm:text-4xl">
                      {service.title}
                    </h2>
                    <p className="mt-1 text-base text-white/80 sm:text-lg">{details.price}</p>
                  </div>
                </div>
              </div>

              {/* Content */}
              <div className="p-6 sm:p-8 md:p-10">
                <p className="mb-8 text-base leading-relaxed text-white/70 sm:text-lg">
                  {details.fullDescription}
                </p>

                {/* Features */}
                <div className="mb-8">
                  <h3 className="mb-4 text-xl font-bold text-white sm:text-2xl">Что входит в услугу</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {details.features.map((feature, index) => (
                      <div
                        key={index}
                        className="flex items-start gap-3 p-3 bg-white/5 rounded-xl border border-white/10"
                      >
                        <Check className={`w-5 h-5 flex-shrink-0 mt-0.5 text-green-400`} />
                        <span className="text-sm text-white/80 sm:text-base">{feature}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Process */}
                <div className="mb-8">
                  <h3 className="mb-4 text-xl font-bold text-white sm:text-2xl">Процесс работы</h3>
                  <div className="space-y-3">
                    {details.process.map((step, index) => (
                      <div
                        key={index}
                        className="flex items-start gap-4 rounded-xl border border-white/10 bg-white/5 p-4"
                      >
                        <div className={`w-8 h-8 rounded-full bg-gradient-to-r ${service.color} flex items-center justify-center text-white font-bold flex-shrink-0`}>
                          {index + 1}
                        </div>
                        <span className="text-sm text-white/80 sm:text-base">{step}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* CTA Button */}
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => {
                    onClose();
                    document.getElementById('контакты')?.scrollIntoView({ behavior: 'smooth' });
                  }}
                  className={`w-full sm:w-auto px-8 py-4 bg-gradient-to-r ${service.color} text-white rounded-xl transition-transform duration-300 font-medium transform-gpu will-change-transform`}
                >
                  Заказать услугу
                </motion.button>
              </div>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
}
