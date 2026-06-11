import { motion } from 'motion/react';
import { ExternalLink } from 'lucide-react';
import { ImageWithFallback } from './figma/ImageWithFallback';
import { useState } from 'react';
import { ProjectModal } from './ProjectModal';

const projects = [
  {
    title: 'E-commerce платформа',
    category: 'Интернет-магазин',
    image: 'https://images.unsplash.com/photo-1622131815526-eaae1e615381?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxtb2Rlcm4lMjB3b3Jrc3BhY2UlMjBkZXNrJTIwbGFwdG9wfGVufDF8fHx8MTc3MjQxODA4OXww&ixlib=rb-4.1.0&q=80&w=1080',
    gradient: 'from-purple-600 to-blue-600',
    description: 'Полнофункциональная платформа интернет-магазина с интеграцией платежных систем, системой управления заказами и личным кабинетом пользователя.',
    technologies: ['React', 'Node.js', 'PostgreSQL', 'Stripe'],
    timeline: '4 месяца',
  },
  {
    title: 'Корпоративный сайт',
    category: 'B2B решение',
    image: 'https://images.unsplash.com/photo-1758691736843-90f58dce465e?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxjcmVhdGl2ZSUyMHRlYW0lMjBjb2xsYWJvcmF0aW9uJTIwb2ZmaWNlfGVufDF8fHx8MTc3MjQxMDU3NXww&ixlib=rb-4.1.0&q=80&w=1080',
    gradient: 'from-pink-600 to-orange-600',
    description: 'Представительский корпоративный сайт с многоязычной поддержкой, системой управления контентом и интеграцией с CRM.',
    technologies: ['Next.js', 'TypeScript', 'Sanity CMS', 'Tailwind'],
    timeline: '3 месяца',
  },
  {
    title: 'SaaS приложение',
    category: 'Стартап',
    image: 'https://images.unsplash.com/photo-1761623135965-6f32e8a916b8?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxtaW5pbWFsaXN0JTIwd2ViJTIwZGVzaWduJTIwbW9ja3VwfGVufDF8fHx8MTc3MjQyNDQ4MXww&ixlib=rb-4.1.0&q=80&w=1080',
    gradient: 'from-cyan-600 to-blue-600',
    description: 'Облачное SaaS-решение для автоматизации бизнес-процессов с системой аналитики, дашбордами и API для интеграций.',
    technologies: ['React', 'GraphQL', 'AWS', 'MongoDB'],
    timeline: '6 месяцев',
  },
];

export function Portfolio() {
  const [selectedProject, setSelectedProject] = useState<typeof projects[0] | null>(null);

  return (
    <section id="портфолио" className="relative overflow-hidden bg-gradient-to-b from-black via-gray-950 to-black py-16 sm:py-24 md:py-32 scroll-mt-20">
      <div className="content-shell">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-12 sm:mb-16 md:mb-20"
        >
          <h2 className="mb-4 px-2 text-3xl font-bold text-white sm:mb-6 sm:text-4xl md:text-5xl lg:text-6xl">
            Наши <span className="bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text text-transparent">Проекты</span>
          </h2>
          <p className="mx-auto max-w-2xl px-2 text-base text-white/60 sm:text-lg md:text-xl">
            Каждый проект — это история успеха наших клиентов
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 md:gap-8">
          {projects.map((project, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 50 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.2 }}
              onClick={() => setSelectedProject(project)}
              className="group relative aspect-[4/5] rounded-2xl sm:rounded-3xl overflow-hidden cursor-pointer transform-gpu will-change-transform"
            >
              {/* Image */}
              <ImageWithFallback
                src={project.image}
                alt={project.title}
                className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
              />

              {/* Gradient overlay */}
              <div className={`absolute inset-0 bg-gradient-to-t ${project.gradient} opacity-60 group-hover:opacity-80 transition-opacity duration-500`} />

              {/* Content */}
              <div className="absolute inset-0 p-6 sm:p-8 flex flex-col justify-end">
                <div>
                  <p className="text-white/80 text-xs sm:text-sm mb-1 sm:mb-2">{project.category}</p>
                  <h3 className="mb-3 text-xl font-bold text-white sm:mb-4 sm:text-2xl lg:text-3xl">{project.title}</h3>
                  
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedProject(project);
                    }}
                    className="inline-flex translate-y-0 items-center gap-2 rounded-full bg-white px-4 py-2 text-sm font-medium text-black opacity-100 transition-[transform,opacity] duration-500 sm:translate-y-4 sm:px-6 sm:py-3 sm:text-base sm:opacity-0 sm:group-hover:translate-y-0 sm:group-hover:opacity-100 hover:scale-105 active:scale-95 transform-gpu will-change-transform"
                  >
                    Смотреть кейс
                    <ExternalLink className="w-3 h-3 sm:w-4 sm:h-4" />
                  </button>
                </div>
              </div>

              {/* Border glow effect */}
              <div className="absolute inset-0 rounded-2xl sm:rounded-3xl ring-2 ring-white/0 group-hover:ring-white/20 transition-[box-shadow] duration-500" />
            </motion.div>
          ))}
        </div>

        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ delay: 0.8 }}
          className="mt-12 px-2 text-center sm:mt-16"
        >
          <button 
            onClick={() => {
              if (projects.length > 0) {
                setSelectedProject(projects[0]);
              }
            }}
            className="w-full sm:w-auto px-6 sm:px-8 py-3 sm:py-4 bg-white/10 md:backdrop-blur-sm text-white rounded-full border border-white/20 hover:bg-white/20 transition-colors duration-300"
          >
            Посмотреть все проекты
          </button>
        </motion.div>
      </div>

      {/* Project Modal */}
      <ProjectModal 
        project={selectedProject} 
        onClose={() => setSelectedProject(null)} 
      />
    </section>
  );
}
