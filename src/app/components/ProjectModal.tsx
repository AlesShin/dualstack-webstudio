import { motion, AnimatePresence } from 'motion/react';
import { X, ExternalLink, Calendar, Tag } from 'lucide-react';

interface Project {
  title: string;
  category: string;
  image: string;
  gradient: string;
  description?: string;
  technologies?: string[];
  timeline?: string;
  link?: string;
}

interface ProjectModalProps {
  project: Project | null;
  onClose: () => void;
}

export function ProjectModal({ project, onClose }: ProjectModalProps) {
  if (!project) return null;

  return (
    <AnimatePresence>
      {project && (
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

              {/* Image */}
              <div className="relative aspect-video w-full overflow-hidden rounded-t-2xl sm:rounded-t-3xl">
                <img
                  src={project.image}
                  alt={project.title}
                  className="w-full h-full object-cover"
                />
                <div className={`absolute inset-0 bg-gradient-to-t ${project.gradient} opacity-40`} />
              </div>

              {/* Content */}
              <div className="p-6 sm:p-8 md:p-10">
                <div className="mb-4 flex items-start justify-between pr-8 sm:pr-10">
                  <div>
                    <p className="mb-2 text-sm text-purple-400">{project.category}</p>
                    <h2 className="mb-4 text-2xl font-bold text-white sm:text-4xl">
                      {project.title}
                    </h2>
                  </div>
                </div>

                <p className="mb-6 text-base leading-relaxed text-white/70 sm:text-lg">
                  {project.description || 
                    `Этот проект представляет собой современное веб-решение, разработанное с использованием последних технологий. 
                    Мы создали уникальный дизайн и функциональную платформу, которая помогла клиенту достичь своих бизнес-целей.`
                  }
                </p>

                {/* Info Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
                  <div className="flex items-start gap-3 p-4 bg-white/5 rounded-xl border border-white/10">
                    <Calendar className="w-5 h-5 text-purple-400 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="text-white/60 text-sm mb-1">Срок разработки</p>
                      <p className="text-white">{project.timeline || '3 месяца'}</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3 p-4 bg-white/5 rounded-xl border border-white/10">
                    <Tag className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="text-white/60 text-sm mb-1">Технологии</p>
                      <p className="text-sm text-white sm:text-base">
                        {project.technologies?.join(', ') || 'React, TypeScript, Tailwind CSS'}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Features */}
                <div className="mb-6">
                  <h3 className="mb-4 text-lg font-bold text-white sm:text-xl">Ключевые особенности</h3>
                  <ul className="space-y-3">
                    {[
                      'Современный адаптивный дизайн',
                      'Высокая производительность и оптимизация',
                      'Интуитивный интерфейс пользователя',
                      'SEO-оптимизация и аналитика',
                    ].map((feature, index) => (
                      <li key={index} className="flex items-start gap-3 text-sm text-white/80 sm:text-base">
                        <span className={`w-1.5 h-1.5 rounded-full bg-gradient-to-r ${project.gradient}`} />
                        {feature}
                      </li>
                    ))}
                  </ul>
                </div>

                {/* CTA Button */}
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => {
                    onClose();
                    document.getElementById('контакты')?.scrollIntoView({ behavior: 'smooth' });
                  }}
                  className={`w-full sm:w-auto px-8 py-4 bg-gradient-to-r ${project.gradient} text-white rounded-xl transition-transform duration-300 flex items-center justify-center gap-2 font-medium transform-gpu will-change-transform`}
                >
                  Обсудить похожий проект
                  <ExternalLink className="w-5 h-5" />
                </motion.button>
              </div>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
}
