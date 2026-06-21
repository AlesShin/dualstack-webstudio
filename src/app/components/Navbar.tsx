import { motion } from 'motion/react';
import { ChevronDown, Menu, X } from 'lucide-react';
import { useState } from 'react';

interface NavChildItem {
  name: string;
  id: string;
}

interface NavItem {
  name: string;
  id: string;
  children?: NavChildItem[];
}

const serviceDropdownItems: NavChildItem[] = [
  { name: 'Акции', id: 'услуги-акции' },
  { name: 'Разработка сайтов', id: 'услуги-разработка' },
  { name: 'SEO продвижение', id: 'услуги-seo' },
  { name: 'Брендинг', id: 'услуги-брендинг' },
];

const navItems: NavItem[] = [
  { name: 'О нас', id: 'о-нас' },
  { name: 'Услуги', id: 'услуги', children: serviceDropdownItems },
  { name: 'Портфолио', id: 'портфолио' },
  { name: 'Контакты', id: 'контакты' },
];

function scrollToId(id: string) {
  document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
}

export function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const [isServicesOpen, setIsServicesOpen] = useState(false);
  const [isDesktopServicesOpen, setIsDesktopServicesOpen] = useState(false);

  function closeMobileMenu() {
    setIsOpen(false);
    setIsServicesOpen(false);
    setIsDesktopServicesOpen(false);
  }

  function navigateTo(id: string) {
    closeMobileMenu();
    scrollToId(id);
  }

  return (
    <motion.nav
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      transition={{ duration: 0.6 }}
      className="fixed left-0 right-0 top-0 z-50 border-b border-white/10 bg-black/80 md:bg-black/50 md:backdrop-blur-lg supports-[backdrop-filter]:md:bg-black/45"
    >
      <div className="content-shell py-2.5 sm:py-4">
        <div className="flex items-center justify-between gap-4">
          <button
            type="button"
            onClick={() => navigateTo('top')}
            className="bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text text-left text-[clamp(1.125rem,2.5vw,1.55rem)] font-bold text-transparent"
          >
            DualStack
          </button>

          <div className="hidden items-center gap-6 lg:flex">
            <div className="flex items-center gap-5 xl:gap-8">
              {navItems.map((item) =>
                item.children ? (
                  <div
                    key={item.id}
                    className="relative"
                    onMouseEnter={() => setIsDesktopServicesOpen(true)}
                    onMouseLeave={() => setIsDesktopServicesOpen(false)}
                  >
                    <button
                      type="button"
                      onClick={() => setIsDesktopServicesOpen((current) => !current)}
                      onFocus={() => setIsDesktopServicesOpen(true)}
                      className="flex items-center gap-1 text-sm text-white/80 transition-colors hover:text-white xl:text-base"
                      aria-expanded={isDesktopServicesOpen}
                      aria-haspopup="menu"
                    >
                      {item.name}
                      <ChevronDown
                        className={`h-4 w-4 transition-transform ${
                          isDesktopServicesOpen ? 'rotate-180' : ''
                        }`}
                      />
                    </button>

                    <div
                      className={`absolute left-1/2 top-full z-40 w-72 -translate-x-1/2 pt-3 transition-all duration-200 ${
                        isDesktopServicesOpen
                          ? 'pointer-events-auto translate-y-0 opacity-100'
                          : 'pointer-events-none translate-y-2 opacity-0'
                      }`}
                    >
                      <div className="rounded-2xl border border-white/10 bg-black/90 p-2 shadow-xl shadow-black/40">
                        <button
                          type="button"
                          onClick={() => navigateTo(item.id)}
                          className="mb-1 block w-full rounded-xl border border-white/10 bg-white/6 px-3 py-2.5 text-left text-sm text-white/90 transition-colors hover:bg-white/10"
                        >
                          Все услуги
                        </button>
                        {item.children.map((child) => (
                          <button
                            key={child.id}
                            type="button"
                            onClick={() => navigateTo(child.id)}
                            className="block w-full rounded-xl px-3 py-2.5 text-left text-sm text-white/75 transition-colors hover:bg-white/8 hover:text-white"
                          >
                            {child.name}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                ) : (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => navigateTo(item.id)}
                    className="text-sm text-white/80 transition-colors hover:text-white xl:text-base"
                  >
                    {item.name}
                  </button>
                ),
              )}
            </div>

            <button
              type="button"
              onClick={() => navigateTo('контакты')}
              className="whitespace-nowrap rounded-full bg-gradient-to-r from-purple-600 to-blue-600 px-5 py-2.5 text-sm text-white transition-transform hover:scale-[1.02] xl:px-6 xl:text-base"
            >
              Обсудить проект
            </button>
          </div>

          <button
            type="button"
            onClick={() => {
              if (isOpen) setIsServicesOpen(false);
              setIsOpen((current) => !current);
            }}
            className="rounded-lg p-2 text-white transition-colors hover:bg-white/10 lg:hidden"
            aria-label={isOpen ? 'Закрыть меню' : 'Открыть меню'}
            aria-expanded={isOpen}
          >
            {isOpen ? <X className="h-5 w-5 sm:h-6 sm:w-6" /> : <Menu className="h-5 w-5 sm:h-6 sm:w-6" />}
          </button>
        </div>

        {isOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            className="mt-3 space-y-2 rounded-2xl border border-white/10 bg-black/90 p-4 lg:hidden"
          >
            {navItems.map((item) =>
              item.children ? (
                <div key={item.id} className="space-y-2">
                  <button
                    type="button"
                    onClick={() => setIsServicesOpen((current) => !current)}
                    className="flex w-full items-center justify-between rounded-lg px-2 py-2 text-sm text-white/85 transition-colors hover:bg-white/8 sm:text-base"
                  >
                    <span>{item.name}</span>
                    <ChevronDown
                      className={`h-4 w-4 transition-transform ${
                        isServicesOpen ? 'rotate-180' : ''
                      }`}
                    />
                  </button>

                  {isServicesOpen && (
                    <div className="ml-2 space-y-1 border-l border-white/12 pl-3">
                      <button
                        type="button"
                        onClick={() => navigateTo(item.id)}
                        className="block w-full rounded-lg px-2 py-2 text-left text-sm text-white/75 hover:bg-white/8 hover:text-white"
                      >
                        Все услуги
                      </button>
                      {item.children.map((child) => (
                        <button
                          key={child.id}
                          type="button"
                          onClick={() => navigateTo(child.id)}
                          className="block w-full rounded-lg px-2 py-2 text-left text-sm text-white/75 hover:bg-white/8 hover:text-white"
                        >
                          {child.name}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              ) : (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => navigateTo(item.id)}
                  className="block w-full rounded-lg px-2 py-2 text-left text-sm text-white/80 hover:bg-white/8 hover:text-white sm:text-base"
                >
                  {item.name}
                </button>
              ),
            )}

            <button
              type="button"
              onClick={() => navigateTo('контакты')}
              className="mt-3 w-full rounded-full bg-gradient-to-r from-purple-600 to-blue-600 px-4 py-2.5 text-sm text-white sm:text-base"
            >
              Обсудить проект
            </button>
          </motion.div>
        )}
      </div>
    </motion.nav>
  );
}
