import { motion, useReducedMotion } from 'motion/react';
import { Mail, MessageCircle, Phone, Send } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';
import {
  CONTACT_EMAIL,
  CONTACT_PHONE,
  CONTACT_TELEGRAM,
  CONTACT_TELEGRAM_LINK,
  submitContactSubmission,
} from '../lib/contact';
import { PrivacyPolicyDialog } from './PrivacyPolicyDialog';
const CONTACT_ITEMS = [
  { icon: Mail, title: 'Email', value: CONTACT_EMAIL, link: `mailto:${CONTACT_EMAIL}` },
  { icon: Phone, title: 'Телефон', value: CONTACT_PHONE, link: 'tel:+79162122532', valueClassName: 'whitespace-nowrap' },
  { icon: MessageCircle, title: 'Telegram', value: CONTACT_TELEGRAM, link: CONTACT_TELEGRAM_LINK },
] as const;

export function Contact() {
  const prefersReducedMotion = useReducedMotion();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    message: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [hasAcceptedPrivacy, setHasAcceptedPrivacy] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Валидация
    if (!formData.name || !formData.email || !formData.message) {
      toast.error('Пожалуйста, заполните все обязательные поля');
      return;
    }

    if (!hasAcceptedPrivacy) {
      toast.error('Подтвердите согласие на обработку персональных данных');
      return;
    }

    setIsSubmitting(true);

    try {
      await submitContactSubmission({
        name: formData.name,
        email: formData.email,
        phone: formData.phone,
        message: formData.message,
        subject: 'Новая заявка с сайта DualStack',
        source: 'Контактная форма сайта',
        details: {
          privacyConsent: 'Подтверждено',
          privacyConsentAt: new Date().toISOString(),
        },
      });

      toast.success('Сообщение успешно отправлено!', {
        description: `Заявка отправлена на ${CONTACT_EMAIL}`,
      });

      // Очистка формы
      setFormData({
        name: '',
        email: '',
        phone: '',
        message: '',
      });
      setHasAcceptedPrivacy(false);
    } catch {
      toast.error('Не удалось отправить сообщение', {
        description: `Попробуйте ещё раз или напишите на ${CONTACT_EMAIL}`,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  return (
    <section id="контакты" className="relative overflow-hidden bg-black py-16 sm:py-24 md:py-32 scroll-mt-20">
      {/* Animated background */}
      <div className="absolute inset-0">
        <motion.div
          className="hidden md:block absolute top-0 right-0 w-64 sm:w-80 md:w-96 h-64 sm:h-80 md:h-96 bg-purple-600/20 rounded-full blur-3xl"
          animate={prefersReducedMotion ? undefined : {
            scale: [1, 1.2, 1],
            x: [0, -50, 0],
          }}
          transition={prefersReducedMotion ? undefined : {
            duration: 10,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
        />
        <motion.div
          className="hidden md:block absolute bottom-0 left-0 w-64 sm:w-80 md:w-96 h-64 sm:h-80 md:h-96 bg-blue-600/20 rounded-full blur-3xl"
          animate={prefersReducedMotion ? undefined : {
            scale: [1, 1.3, 1],
            x: [0, 50, 0],
          }}
          transition={prefersReducedMotion ? undefined : {
            duration: 8,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
        />
      </div>

      <div className="content-shell relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-12 sm:mb-16 md:mb-20"
        >
          <h2 className="mb-4 px-2 text-3xl font-bold text-white sm:mb-6 sm:text-4xl md:text-5xl lg:text-6xl">
            Готовы начать <span className="bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">проект?</span>
          </h2>
          <p className="mx-auto max-w-2xl px-2 text-base text-white/60 sm:text-lg md:text-xl">
            Свяжитесь с нами и получите бесплатную консультацию
          </p>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 sm:gap-10 md:gap-12">
          {/* Contact Info */}
          <motion.div
            initial={{ opacity: 0, x: -50 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="space-y-6 sm:space-y-8"
          >
            <div className="space-y-4 sm:space-y-6">
              {CONTACT_ITEMS.map((item, index) => (
                <motion.a
                  key={index}
                  href={item.link}
                  whileHover={{ x: 8 }}
                  className="flex items-center gap-3 sm:gap-4 p-4 sm:p-6 bg-white/5 md:backdrop-blur-sm rounded-xl sm:rounded-2xl border border-white/10 hover:border-white/20 transition-[transform,border-color] transform-gpu will-change-transform"
                >
                  <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-lg sm:rounded-xl bg-gradient-to-r from-purple-600 to-blue-600 flex items-center justify-center flex-shrink-0">
                    <item.icon className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                  </div>
                  <div className="min-w-0">
                    <h3 className="text-white/60 text-xs sm:text-sm mb-1">{item.title}</h3>
                    <p className={`text-white text-base sm:text-lg ${item.valueClassName ?? ''}`}>{item.value}</p>
                  </div>
                </motion.a>
              ))}
            </div>

            <div className="p-6 sm:p-8 bg-gradient-to-br from-purple-600/20 to-blue-600/20 md:backdrop-blur-sm rounded-2xl sm:rounded-3xl border border-white/10">
              <h3 className="text-xl sm:text-2xl font-bold text-white mb-3 sm:mb-4">
                Почему выбирают нас?
              </h3>
              <ul className="space-y-2 sm:space-y-3 text-sm sm:text-base text-white/80">
                <li className="flex items-start gap-2">
                  <span className="w-1.5 h-1.5 bg-purple-400 rounded-full flex-shrink-0" />
                  Индивидуальный подход к каждому проекту
                </li>
                <li className="flex items-start gap-2">
                  <span className="w-1.5 h-1.5 bg-blue-400 rounded-full flex-shrink-0" />
                  Современные технологии и инструменты
                </li>
                <li className="flex items-start gap-2">
                  <span className="w-1.5 h-1.5 bg-pink-400 rounded-full flex-shrink-0" />
                  Поддержка после запуска проекта
                </li>
                <li className="flex items-start gap-2">
                  <span className="w-1.5 h-1.5 bg-cyan-400 rounded-full flex-shrink-0" />
                  Прозрачное ценообразование
                </li>
              </ul>
            </div>
          </motion.div>

          {/* Contact Form */}
          <motion.div
            initial={{ opacity: 0, x: 50 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="p-6 sm:p-8 bg-white/5 md:backdrop-blur-sm rounded-2xl sm:rounded-3xl border border-white/10"
          >
            <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">
              <div>
                <label className="block text-white/60 text-xs sm:text-sm mb-2">Ваше имя *</label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  placeholder="Иван Иванов"
                  required
                  className="w-full px-3 sm:px-4 py-2.5 sm:py-3 bg-white/5 border border-white/10 rounded-lg sm:rounded-xl text-sm sm:text-base text-white placeholder:text-white/30 focus:outline-none focus:border-purple-500 transition-colors"
                />
              </div>

              <div>
                <label className="block text-white/60 text-xs sm:text-sm mb-2">Email *</label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="ivan@example.com"
                  required
                  className="w-full px-3 sm:px-4 py-2.5 sm:py-3 bg-white/5 border border-white/10 rounded-lg sm:rounded-xl text-sm sm:text-base text-white placeholder:text-white/30 focus:outline-none focus:border-purple-500 transition-colors"
                />
              </div>

              <div>
                <label className="block text-white/60 text-xs sm:text-sm mb-2">Телефон</label>
                <input
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  placeholder={CONTACT_PHONE}
                  className="w-full px-3 sm:px-4 py-2.5 sm:py-3 bg-white/5 border border-white/10 rounded-lg sm:rounded-xl text-sm sm:text-base text-white placeholder:text-white/30 focus:outline-none focus:border-purple-500 transition-colors"
                />
              </div>

              <div>
                <label className="block text-white/60 text-xs sm:text-sm mb-2">Сообщение *</label>
                <textarea
                  rows={4}
                  name="message"
                  value={formData.message}
                  onChange={handleChange}
                  placeholder="Расскажите о вашем проекте..."
                  required
                  className="w-full px-3 sm:px-4 py-2.5 sm:py-3 bg-white/5 border border-white/10 rounded-lg sm:rounded-xl text-sm sm:text-base text-white placeholder:text-white/30 focus:outline-none focus:border-purple-500 transition-colors resize-none"
                />
              </div>

              <div className="flex items-start gap-3 text-xs leading-relaxed text-white/60 sm:text-sm">
                <input
                  id="privacy-consent"
                  type="checkbox"
                  checked={hasAcceptedPrivacy}
                  onChange={(event) => setHasAcceptedPrivacy(event.target.checked)}
                  className="mt-0.5 h-4 w-4 shrink-0 accent-purple-500"
                />
                <span>
                  <label htmlFor="privacy-consent" className="cursor-pointer">
                    Я соглашаюсь на обработку персональных данных в соответствии с{' '}
                  </label>
                  <PrivacyPolicyDialog triggerClassName="text-left text-cyan-300 underline decoration-cyan-300/40 underline-offset-2 hover:text-cyan-200">
                    политикой конфиденциальности
                  </PrivacyPolicyDialog>
                  .
                </span>
              </div>

              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                type="submit"
                disabled={isSubmitting}
                className="w-full px-6 sm:px-8 py-3 sm:py-4 bg-gradient-to-r from-purple-600 to-blue-600 text-white text-sm sm:text-base rounded-lg sm:rounded-xl transition-transform duration-300 hover:scale-[1.01] flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed transform-gpu will-change-transform"
              >
                {isSubmitting ? 'Отправка...' : 'Отправить сообщение'}
                {!isSubmitting && <Send className="w-4 h-4 sm:w-5 sm:h-5" />}
              </motion.button>
            </form>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
