import { AnimatePresence, motion } from 'motion/react';
import {
  ArrowRight,
  Check,
  X,
} from 'lucide-react';
import { useState } from 'react';
import { serviceCategories, type ServiceCatalogOffer } from '../lib/serviceCatalog';

interface ServicesProps {
  canOrderDirectly?: boolean;
  onOrderOffer?: (offer: ServiceCatalogOffer) => void;
  onRequestOffer?: (offer: ServiceCatalogOffer) => void;
}

export function Services({
  canOrderDirectly = false,
  onOrderOffer,
  onRequestOffer,
}: ServicesProps) {
  const [selectedOffer, setSelectedOffer] = useState<ServiceCatalogOffer | null>(null);

  return (
    <section id="услуги" className="relative overflow-hidden bg-black py-16 sm:py-24 md:py-32 scroll-mt-20">
      <div className="absolute inset-0 bg-gradient-to-b from-black via-purple-950/20 to-black" />

      <div className="content-shell relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="mb-10 text-center sm:mb-14 md:mb-16"
        >
          <h2 className="mb-4 px-2 text-3xl font-bold text-white sm:mb-6 sm:text-4xl md:text-5xl lg:text-6xl">
            <span className="bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
              Услуги
            </span>
          </h2>
          <p className="mx-auto max-w-3xl px-2 text-base text-white/60 sm:text-lg md:text-xl">
            Выберите направление и откройте карточку предложения с ценой, описанием и быстрым переходом к заказу.
          </p>
        </motion.div>

        <div className="mb-8 flex flex-wrap justify-center gap-2 sm:gap-3 md:mb-10">
          {serviceCategories.map((category) => (
            <a
              key={category.id}
              href={`#услуги-${category.id}`}
              className="rounded-full border border-white/15 bg-white/5 px-4 py-2 text-sm text-white/80 transition-colors hover:border-white/30 hover:text-white sm:px-5 sm:py-2.5"
            >
              {category.title}
            </a>
          ))}
        </div>

        <div className="space-y-8 sm:space-y-10 md:space-y-12">
          {serviceCategories.map((category, categoryIndex) => (
            <motion.div
              key={category.id}
              id={`услуги-${category.id}`}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.2 }}
              transition={{ duration: 0.5, delay: categoryIndex * 0.05 }}
              className="relative overflow-hidden rounded-2xl border border-white/10 bg-white/[0.03] sm:rounded-3xl"
            >
              <div className={`absolute inset-0 bg-gradient-to-br ${category.color} opacity-[0.08]`} />
              <div className="relative p-5 sm:p-7 md:p-8">
                <div className="mb-5 flex flex-col gap-3 sm:mb-6 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex items-start gap-3 sm:gap-4">
                    <div className={`flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-r ${category.color} sm:h-12 sm:w-12`}>
                      <category.icon className="h-5 w-5 text-white sm:h-6 sm:w-6" />
                    </div>
                    <div>
                      <h3 className="text-2xl font-bold text-white sm:text-3xl">{category.title}</h3>
                      <p className="mt-1 text-sm text-white/65 sm:text-base">{category.subtitle}</p>
                    </div>
                  </div>
                  <div className="rounded-full border border-white/15 bg-black/30 px-3 py-1.5 text-xs text-white/70 sm:text-sm">
                    {category.offers.length} предложений
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4 xl:grid-cols-3">
                  {category.offers.map((offer) => (
                    <motion.button
                      key={offer.id}
                      whileHover={{ y: -4, scale: 1.01 }}
                      whileTap={{ scale: 0.995 }}
                      onClick={() =>
                        setSelectedOffer({
                          ...offer,
                          categoryId: category.id,
                          categoryTitle: category.title,
                          color: category.color,
                        })
                      }
                      className="group rounded-2xl border border-white/10 bg-black/35 p-4 text-left transition-colors hover:border-white/25 sm:p-5"
                    >
                      <div className="mb-3 flex items-start justify-between gap-3">
                        <h4 className="text-base font-semibold text-white sm:text-lg">{offer.title}</h4>
                        <span className="shrink-0 rounded-full border border-white/15 bg-white/5 px-2.5 py-1 text-xs text-white/70">
                          {offer.price}
                        </span>
                      </div>
                      <p className="mb-4 text-sm leading-relaxed text-white/65 sm:text-base">{offer.summary}</p>
                      <div className="inline-flex items-center gap-2 text-sm text-white/75 transition-colors group-hover:text-white">
                        Открыть карточку
                        <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                      </div>
                    </motion.button>
                  ))}
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.4 }}
          transition={{ duration: 0.45 }}
          className="relative mt-10 overflow-hidden rounded-2xl border border-white/12 bg-white/[0.04] p-6 sm:mt-12 sm:rounded-3xl sm:p-8 md:p-10"
        >
          <div className="absolute inset-0 bg-gradient-to-r from-purple-600/20 via-blue-600/10 to-cyan-500/20" />
          <div className="relative flex flex-col gap-4 sm:gap-5 md:flex-row md:items-center md:justify-between">
            <div className="max-w-2xl">
              <h3 className="text-2xl font-bold text-white sm:text-3xl">
                Не смогли определиться с тарифом?
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-white/75 sm:text-base">
                Напишите нам в свободной форме — подберём оптимальный формат работ и предложим лучшие варианты по срокам и бюджету.
              </p>
            </div>
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => {
                document.getElementById('контакты')?.scrollIntoView({ behavior: 'smooth' });
              }}
              className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-purple-600 to-blue-600 px-6 py-3 text-white sm:w-auto sm:px-7 sm:py-3.5"
            >
              Напишите нам
              <ArrowRight className="h-4 w-4" />
            </motion.button>
          </div>
        </motion.div>
      </div>

      <AnimatePresence>
        {selectedOffer && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedOffer(null)}
              className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm"
            />

            <div className="fixed inset-0 z-50 flex items-center justify-center p-3 pointer-events-none sm:p-4">
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 18 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 18 }}
                transition={{ duration: 0.35 }}
                onClick={(event) => event.stopPropagation()}
                className="pointer-events-auto relative w-full max-w-3xl max-h-[calc(100svh-1.5rem)] overflow-y-auto rounded-2xl border border-white/10 bg-gray-900 sm:max-h-[90vh] sm:rounded-3xl"
              >
                <button
                  onClick={() => setSelectedOffer(null)}
                  className="absolute right-3 top-3 z-10 flex h-9 w-9 items-center justify-center rounded-full border border-white/15 bg-black/45 text-white transition-colors hover:bg-black/70 sm:h-10 sm:w-10"
                >
                  <X className="h-4 w-4 sm:h-5 sm:w-5" />
                </button>

                <div className={`rounded-t-2xl bg-gradient-to-r ${selectedOffer.color} p-6 pr-12 sm:rounded-t-3xl sm:p-8 sm:pr-14`}>
                  <p className="mb-2 text-sm text-white/80">{selectedOffer.categoryTitle}</p>
                  <h3 className="text-2xl font-bold text-white sm:text-4xl">{selectedOffer.title}</h3>
                  <p className="mt-2 inline-flex rounded-full border border-white/25 bg-black/20 px-3 py-1 text-sm text-white/90">
                    {selectedOffer.price}
                  </p>
                </div>

                <div className="p-6 sm:p-8 md:p-10">
                  <p className="mb-6 text-base leading-relaxed text-white/75 sm:text-lg">
                    {selectedOffer.description}
                  </p>

                  <div className="mb-8 space-y-3">
                    {selectedOffer.bullets.map((bullet) => (
                      <div
                        key={bullet}
                        className="flex items-start gap-3 rounded-xl border border-white/10 bg-white/5 p-3 sm:p-4"
                      >
                        <Check className="mt-0.5 h-5 w-5 shrink-0 text-green-400" />
                        <span className="text-sm text-white/80 sm:text-base">{bullet}</span>
                      </div>
                    ))}
                  </div>

                  <p className="mb-5 rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm leading-relaxed text-white/70">
                    {canOrderDirectly
                      ? 'Если вы уже вошли как клиент, заказ сразу появится в вашем кабинете и станет виден администратору.'
                      : 'Если хотите заказать эту услугу без входа, мы переведём вас к контактной форме для быстрой заявки.'}
                  </p>

                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => {
                      const offerToOrder = selectedOffer;
                      setSelectedOffer(null);

                      if (canOrderDirectly && onOrderOffer) {
                        onOrderOffer(offerToOrder);
                        return;
                      }

                      onRequestOffer?.(offerToOrder);
                      document.getElementById('контакты')?.scrollIntoView({ behavior: 'smooth' });
                    }}
                    className={`w-full sm:w-auto rounded-xl bg-gradient-to-r ${selectedOffer.color} px-8 py-4 font-medium text-white`}
                  >
                    {canOrderDirectly ? 'Заказать в кабинет' : 'Заказать'}
                  </motion.button>
                </div>
              </motion.div>
            </div>
          </>
        )}
      </AnimatePresence>
    </section>
  );
}
