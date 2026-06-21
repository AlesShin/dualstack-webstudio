import { lazy, Suspense, useState } from 'react';
import { MotionConfig } from 'motion/react';
import { Toaster } from 'sonner';

import { About } from './components/About';
import { Contact } from './components/Contact';
import { Footer } from './components/Footer';
import { Hero } from './components/Hero';
import { Navbar } from './components/Navbar';
import { Portfolio } from './components/Portfolio';
import { ScrollToTopButton } from './components/ScrollToTopButton';
import { Services } from './components/Services';
import type { ServiceCatalogOffer } from './lib/serviceCatalog';

const SupportChatWidget = lazy(() =>
  import('./components/SupportChatWidget').then((module) => ({
    default: module.SupportChatWidget,
  })),
);

export default function App() {
  const [selectedContactOffer, setSelectedContactOffer] =
    useState<ServiceCatalogOffer | null>(null);

  return (
    <MotionConfig
      reducedMotion="user"
      transition={{
        type: 'spring',
        stiffness: 260,
        damping: 24,
        mass: 0.65,
      }}
    >
      <div className="min-h-screen overflow-x-hidden bg-black scroll-smooth">
        <Toaster
          position="top-right"
          theme="dark"
          toastOptions={{
            style: {
              background: 'rgba(0, 0, 0, 0.9)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              backdropFilter: 'blur(12px)',
            },
          }}
        />

        <Navbar />
        <main>
          <Hero />
          <About />
          <Services onRequestOffer={setSelectedContactOffer} />
          <Portfolio />
          <Contact
            selectedOffer={selectedContactOffer}
            onClearSelectedOffer={() => setSelectedContactOffer(null)}
          />
        </main>

        <Suspense fallback={null}>
          <SupportChatWidget />
        </Suspense>
        <Footer />
        <ScrollToTopButton />
      </div>
    </MotionConfig>
  );
}
