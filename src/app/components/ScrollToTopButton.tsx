import { AnimatePresence, motion } from 'motion/react';
import { ArrowUp } from 'lucide-react';
import { useEffect, useState } from 'react';

export function ScrollToTopButton() {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    function handleScroll() {
      setIsVisible(window.scrollY > 360);
    }

    handleScroll();
    window.addEventListener('scroll', handleScroll, { passive: true });

    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <AnimatePresence>
      {isVisible ? (
        <motion.button
          type="button"
          initial={{ opacity: 0, y: 18, scale: 0.94 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 12, scale: 0.94 }}
          transition={{ duration: 0.2 }}
          onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
          className="fixed bottom-4 left-4 z-40 inline-flex items-center gap-2 rounded-full border border-white/12 bg-black/88 px-3 py-3 text-white shadow-xl shadow-black/45 backdrop-blur-sm transition-colors hover:bg-black sm:bottom-6 sm:left-6"
          aria-label="Прокрутить наверх"
        >
          <span className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-r from-cyan-400 via-blue-500 to-purple-600">
            <ArrowUp className="h-4 w-4" />
          </span>
          <span className="hidden pr-1 text-sm text-white/90 sm:inline">Наверх</span>
        </motion.button>
      ) : null}
    </AnimatePresence>
  );
}
