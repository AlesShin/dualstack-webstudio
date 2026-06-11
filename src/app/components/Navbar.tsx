import { motion } from 'motion/react';
import {
  ChevronDown,
  LogIn,
  LogOut,
  Menu,
  MessageSquareMore,
  UserRound,
  UserPlus,
  X,
} from 'lucide-react';
import { useState } from 'react';

import type { PortalUser } from '../lib/clientPortal';
import type { AuthTab } from './AuthDialog';

interface NavChildItem {
  name: string;
  id: string;
}

interface NavItem {
  name: string;
  id: string;
  children?: NavChildItem[];
}

interface NavbarProps {
  user: PortalUser | null;
  isLandingView: boolean;
  onOpenAuth: (tab: AuthTab) => void;
  onGoHome: () => void;
  onOpenPortal: () => void;
  onOpenChat: () => void;
  onLogout: () => void;
}

const serviceDropdownItems: NavChildItem[] = [
  { name: 'Акции', id: 'услуги-акции' },
  { name: 'Разработка сайтов', id: 'услуги-разработка' },
  { name: 'SEO продвижение', id: 'услуги-seo' },
  { name: 'Брендинг', id: 'услуги-брендинг' },
];

const landingNavItems: NavItem[] = [
  { name: 'О нас', id: 'о-нас' },
  { name: 'Услуги', id: 'услуги', children: serviceDropdownItems },
  { name: 'Портфолио', id: 'портфолио' },
  { name: 'Контакты', id: 'контакты' },
];

const portalNavItems: NavItem[] = [
  { name: 'Сводка', id: 'кабинет-сводка' },
  { name: 'Проекты', id: 'кабинет-проекты' },
  { name: 'Активность', id: 'кабинет-активность' },
];

const authTabs: Array<{ label: string; value: AuthTab; icon: typeof LogIn }> = [
  { label: 'Вход', value: 'login', icon: LogIn },
  { label: 'Регистрация', value: 'register', icon: UserPlus },
];

function scrollToId(id: string) {
  document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
}

export function Navbar({
  user,
  isLandingView,
  onOpenAuth,
  onGoHome,
  onOpenPortal,
  onOpenChat,
  onLogout,
}: NavbarProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isServicesOpen, setIsServicesOpen] = useState(false);
  const [isDesktopServicesOpen, setIsDesktopServicesOpen] = useState(false);

  const isPortalView = Boolean(user) && !isLandingView;
  const navItems = isPortalView ? portalNavItems : landingNavItems;

  function openAuthDialog(tab: AuthTab) {
    onOpenAuth(tab);
    setIsOpen(false);
    setIsServicesOpen(false);
    setIsDesktopServicesOpen(false);
  }

  function closeMobileMenu() {
    setIsOpen(false);
    setIsServicesOpen(false);
    setIsDesktopServicesOpen(false);
  }

  return (
    <>
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
              onClick={() => {
                closeMobileMenu();
                onGoHome();
              }}
              className="bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text text-left text-[clamp(1.125rem,2.5vw,1.55rem)] font-bold text-transparent"
            >
              DualStack
            </button>

            <div className="hidden items-center gap-6 lg:flex">
              <div className="flex items-center gap-5 xl:gap-8">
                {navItems.map((item) =>
                  !isPortalView && item.children ? (
                    <div
                      key={item.id}
                      className="relative"
                      onMouseEnter={() => setIsDesktopServicesOpen(true)}
                      onMouseLeave={() => setIsDesktopServicesOpen(false)}
                    >
                      <button
                        type="button"
                        onClick={() => setIsDesktopServicesOpen((prev) => !prev)}
                        onFocus={() => setIsDesktopServicesOpen(true)}
                        className={`flex cursor-pointer items-center gap-1 text-sm transition-colors xl:text-base ${
                          isDesktopServicesOpen ? 'text-white' : 'text-white/80 hover:text-white'
                        }`}
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
                            onClick={() => {
                              scrollToId(item.id);
                              setIsDesktopServicesOpen(false);
                            }}
                            className="mb-1 block w-full rounded-xl border border-white/10 bg-white/6 px-3 py-2.5 text-left text-sm text-white/90 transition-colors hover:bg-white/10"
                          >
                            Все услуги
                          </button>
                          {item.children.map((child) => (
                            <button
                              key={child.id}
                              type="button"
                              onClick={() => {
                                scrollToId(child.id);
                                setIsDesktopServicesOpen(false);
                              }}
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
                      onClick={() => {
                        setIsDesktopServicesOpen(false);
                        scrollToId(item.id);
                      }}
                      className="cursor-pointer text-sm text-white/80 transition-colors hover:text-white xl:text-base"
                    >
                      {item.name}
                    </button>
                  ),
                )}
              </div>

              {user ? (
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={onOpenChat}
                    className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/6 px-4 py-2 text-sm text-white/80 transition-colors hover:bg-white/10 hover:text-white"
                  >
                    <MessageSquareMore className="h-4 w-4" />
                    Онлайн-чат
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      if (isPortalView) {
                        scrollToId('кабинет-сводка');
                        return;
                      }

                      onOpenPortal();
                    }}
                    className="inline-flex items-center gap-2 rounded-full border border-cyan-400/20 bg-cyan-400/12 px-4 py-2 text-sm text-cyan-100"
                  >
                    <UserRound className="h-4 w-4" />
                    {user.name}
                  </button>

                  <button
                    type="button"
                    onClick={onLogout}
                    className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/6 px-4 py-2 text-sm text-white/75 transition-colors hover:bg-white/10 hover:text-white"
                  >
                    <LogOut className="h-4 w-4" />
                    Выйти
                  </button>
                </div>
              ) : (
                <div className="flex items-center gap-3">
                  <div className="inline-flex items-center rounded-full border border-white/10 bg-white/6 p-1 shadow-lg shadow-black/25 backdrop-blur">
                    {authTabs.map(({ label, value, icon: Icon }) => (
                      <button
                        key={value}
                        type="button"
                        onClick={() => openAuthDialog(value)}
                        className="inline-flex items-center gap-2 rounded-full px-3 py-2 text-sm text-white/80 transition-colors hover:bg-white/10 hover:text-white xl:px-4"
                      >
                        <Icon className="h-4 w-4" />
                        {label}
                      </button>
                    ))}
                  </div>

                  <button
                    type="button"
                    onClick={() => scrollToId('контакты')}
                    className="whitespace-nowrap rounded-full bg-gradient-to-r from-purple-600 to-blue-600 px-4 py-2 text-sm text-white transition-transform transform-gpu will-change-transform xl:px-6 xl:text-base"
                  >
                    Начать проект
                  </button>
                </div>
              )}
            </div>

            <button
              type="button"
              onClick={() => {
                if (isOpen) {
                  setIsServicesOpen(false);
                }
                setIsOpen(!isOpen);
              }}
              className="rounded-lg p-2 text-white transition-colors hover:bg-white/10 lg:hidden"
              aria-label="Toggle menu"
            >
              {isOpen ? <X className="h-5 w-5 sm:h-6 sm:w-6" /> : <Menu className="h-5 w-5 sm:h-6 sm:w-6" />}
            </button>
          </div>

          {isOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="mt-3 space-y-3 rounded-2xl border border-white/10 bg-black/80 p-4 lg:hidden"
            >
              {user ? (
                <div className="rounded-2xl border border-white/10 bg-white/4 p-3">
                  <p className="text-xs uppercase tracking-[0.22em] text-white/40">Профиль</p>
                  <div className="mt-3 grid gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        closeMobileMenu();
                        if (isPortalView) {
                          scrollToId('кабинет-сводка');
                          return;
                        }

                        onOpenPortal();
                      }}
                      className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/6 px-3 py-3 text-sm text-white/85 transition-colors hover:bg-white/10"
                    >
                      <UserRound className="h-4 w-4" />
                      {user.name}
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        closeMobileMenu();
                        onOpenChat();
                      }}
                      className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/6 px-3 py-3 text-sm text-white/85 transition-colors hover:bg-white/10"
                    >
                      <MessageSquareMore className="h-4 w-4" />
                      Онлайн-чат
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        closeMobileMenu();
                        onLogout();
                      }}
                      className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/6 px-3 py-3 text-sm text-white/85 transition-colors hover:bg-white/10"
                    >
                      <LogOut className="h-4 w-4" />
                      Выйти
                    </button>
                  </div>
                </div>
              ) : (
                <div className="rounded-2xl border border-white/10 bg-white/4 p-3">
                  <p className="text-xs uppercase tracking-[0.22em] text-white/40">Аккаунт</p>
                  <div className="mt-3 grid grid-cols-2 gap-2">
                    {authTabs.map(({ label, value, icon: Icon }) => (
                      <button
                        key={value}
                        type="button"
                        onClick={() => openAuthDialog(value)}
                        className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/6 px-3 py-3 text-sm text-white/85 transition-colors hover:bg-white/10"
                      >
                        <Icon className="h-4 w-4" />
                        {label}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {navItems.map((item) =>
                !isPortalView && item.children ? (
                  <div key={item.id} className="space-y-2">
                    <button
                      type="button"
                      onClick={() => setIsServicesOpen((prev) => !prev)}
                      className="flex w-full items-center justify-between rounded-lg px-2 py-2 text-sm text-white/85 transition-colors hover:bg-white/8 sm:text-base"
                    >
                      <span>{item.name}</span>
                      <ChevronDown
                        className={`h-4 w-4 transition-transform ${isServicesOpen ? 'rotate-180' : ''}`}
                      />
                    </button>

                    {isServicesOpen && (
                      <div className="ml-2 space-y-1 border-l border-white/12 pl-3">
                        <button
                          type="button"
                          onClick={() => {
                            closeMobileMenu();
                            scrollToId(item.id);
                          }}
                          className="block w-full rounded-lg px-2 py-2 text-left text-sm text-white/75 transition-colors hover:bg-white/8 hover:text-white"
                        >
                          Все услуги
                        </button>
                        {item.children.map((child) => (
                          <button
                            key={child.id}
                            type="button"
                            onClick={() => {
                              closeMobileMenu();
                              scrollToId(child.id);
                            }}
                            className="block w-full rounded-lg px-2 py-2 text-left text-sm text-white/75 transition-colors hover:bg-white/8 hover:text-white"
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
                    onClick={() => {
                      closeMobileMenu();
                      scrollToId(item.id);
                    }}
                    className="block w-full rounded-lg px-2 py-2 text-left text-sm text-white/80 transition-colors hover:bg-white/8 hover:text-white sm:text-base"
                  >
                    {item.name}
                  </button>
                ),
              )}

              {!user && (
                <button
                  type="button"
                  className="mt-2 w-full rounded-full bg-gradient-to-r from-purple-600 to-blue-600 px-4 py-2.5 text-sm text-white sm:text-base"
                  onClick={() => {
                    closeMobileMenu();
                    scrollToId('контакты');
                  }}
                >
                  Начать проект
                </button>
              )}
            </motion.div>
          )}
        </div>
      </motion.nav>

    </>
  );
}
