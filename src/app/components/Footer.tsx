import { motion } from 'motion/react';
import { Instagram, Music2, Pin, Send } from 'lucide-react';

export function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-black border-t border-white/10 py-8 sm:py-12">
      <div className="content-shell">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-8 sm:gap-10 md:gap-12 mb-8 sm:mb-12">
          {/* Brand */}
          <div className="col-span-1 sm:col-span-2">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="mb-3 sm:mb-4"
            >
              <h3 className="text-xl sm:text-2xl font-bold bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent">
                DualStack
              </h3>
            </motion.div>
            <p className="text-sm sm:text-base text-white/60 mb-4 sm:mb-6 max-w-md">
              Создаём современные веб-решения, которые помогают бизнесу расти и развиваться в цифровом мире.
            </p>
            <div className="flex gap-3 sm:gap-4">
              {[
                { icon: Send, href: 'https://t.me/DualStack', label: 'Telegram' },
                { icon: Pin, href: 'https://pin.it/2xAtIwP2d', label: 'Pinterest' },
                { icon: Music2, href: 'https://www.tiktok.com/@dualstack7?_r=1&_t=ZN-94YUJYi1ufG', label: 'TikTok' },
                { icon: Instagram, href: 'https://www.instagram.com/invites/contact/?igsh=1cw6do5j28dz8&utm_content=j3ateub', label: 'Instagram' },
              ].map((social, index) => (
                <motion.a
                  key={index}
                  href={social.href}
                  aria-label={social.label}
                  whileHover={{ scale: 1.1, y: -2 }}
                  whileTap={{ scale: 0.95 }}
                  className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-white/60 hover:text-white hover:bg-white/10 transition-[transform,color,background-color] transform-gpu will-change-transform"
                >
                  <social.icon className="w-4 h-4 sm:w-5 sm:h-5" />
                </motion.a>
              ))}
            </div>
          </div>

          {/* Links */}
          <div>
            <h4 className="text-white font-semibold mb-3 sm:mb-4 text-sm sm:text-base">Услуги</h4>
            <ul className="space-y-2">
              {[
                { name: 'Разработка сайтов', id: 'услуги' },
                { name: 'Веб-дизайн', id: 'услуги' },
                { name: 'SEO оптимизация', id: 'услуги' },
                { name: 'Поддержка', id: 'контакты' }
              ].map((item, index) => (
                <li key={index}>
                  <a 
                    href={`#${item.id}`} 
                    onClick={() => {
                      document.getElementById(item.id)?.scrollIntoView({ behavior: 'smooth' });
                    }}
                    className="text-sm sm:text-base text-white/60 hover:text-white transition-colors cursor-pointer"
                  >
                    {item.name}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="text-white font-semibold mb-3 sm:mb-4 text-sm sm:text-base">Компания</h4>
            <ul className="space-y-2">
              {[
                { name: 'О нас', id: 'о-нас' },
                { name: 'Портфолио', id: 'портфолио' },
                { name: 'Блог', id: 'контакты' },
                { name: 'Контакты', id: 'контакты' }
              ].map((item, index) => (
                <li key={index}>
                  <a 
                    href={`#${item.id}`}
                    onClick={() => {
                      document.getElementById(item.id)?.scrollIntoView({ behavior: 'smooth' });
                    }}
                    className="text-sm sm:text-base text-white/60 hover:text-white transition-colors cursor-pointer"
                  >
                    {item.name}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Bottom */}
        <div className="pt-6 sm:pt-8 border-t border-white/10 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-white/40 text-xs sm:text-sm text-center md:text-left">
            © {currentYear} DualStack. Все права защищены.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 sm:gap-6 text-xs sm:text-sm text-center">
            <a href="#" className="text-white/40 hover:text-white transition-colors">
              Политика конфиденциальности
            </a>
            <a href="#" className="text-white/40 hover:text-white transition-colors">
              Условия использования
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
