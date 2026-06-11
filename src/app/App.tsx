import { useEffect, useState } from 'react';
import { MotionConfig } from 'motion/react';
import { useLocation, useNavigate } from 'react-router';
import { toast, Toaster } from 'sonner';

import { Navbar } from './components/Navbar';
import { Hero } from './components/Hero';
import { Services } from './components/Services';
import { Portfolio } from './components/Portfolio';
import { About } from './components/About';
import { Contact } from './components/Contact';
import { Footer } from './components/Footer';
import { ClientDashboard } from './components/ClientDashboard';
import { ClientChatWidget } from './components/ClientChatWidget';
import { AdminDashboard } from './components/AdminDashboard';
import { ScrollToTopButton } from './components/ScrollToTopButton';
import { SupportChatWidget } from './components/SupportChatWidget';
import { AuthDialog, type AuthTab } from './components/AuthDialog';
import type {
  AuthSuccessPayload,
  ComposePortalMessageInput,
  CreateProjectInput,
  PortalMessage,
  PortalStore,
} from './lib/clientPortal';
import type { ServiceCatalogOffer } from './lib/serviceCatalog';
import {
  ADMIN_EMAIL,
  applyAuthToStore,
  applySharedPortalStore,
  arePortalStoresEqual,
  clearCurrentUser,
  createMessagesForProject,
  createPortalId,
  createProjectFromInput,
  createReplySnapshot,
  getActiveClientSession,
  getClientSessionById,
  hasMigratedSharedPortalStore,
  loadPortalStore,
  loadSyncedPortalStore,
  loadSharedPortalStore,
  markSharedPortalStoreMigrated,
  mergePortalStoresForSharedMigration,
  normalizeEmail,
  normalizePhone,
  saveSharedPortalStore,
  savePortalStore,
} from './lib/clientPortal';

function getLatestProjectMessageTimestamp(
  messages: PortalMessage[],
  projectId: string,
  fallback: string,
) {
  const latestMessage = messages.reduce<PortalMessage | null>((latest, message) => {
    if (message.projectId !== projectId) return latest;
    if (!latest) return message;
    return new Date(message.createdAt).getTime() > new Date(latest.createdAt).getTime()
      ? message
      : latest;
  }, null);

  return latestMessage?.createdAt ?? fallback;
}

function appendUniqueId(ids: string[] | undefined, id: string) {
  return Array.from(new Set([...(ids ?? []), id]));
}

function appendUniqueIds(ids: string[] | undefined, nextIds: string[]) {
  return Array.from(new Set([...(ids ?? []), ...nextIds]));
}

function normalizeRoutePath(pathname: string) {
  const normalizedPath = pathname.replace(/\/+$/, '');
  return normalizedPath || '/';
}

export default function App() {
  const location = useLocation();
  const navigate = useNavigate();
  const [store, setStore] = useState<PortalStore>(() => loadPortalStore());
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);
  const [selectedAdminClientId, setSelectedAdminClientId] = useState<string | null>(null);
  const [selectedAdminProjectId, setSelectedAdminProjectId] = useState<string | null>(null);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [isSharedStoreReady, setIsSharedStoreReady] = useState(false);
  const [isSharedStoreAvailable, setIsSharedStoreAvailable] = useState(false);

  const currentUser = store.currentUser;
  const currentClientSession = getActiveClientSession(store);
  const routePath = normalizeRoutePath(location.pathname);
  const isLoginRoute = routePath === '/login';
  const isRegisterRoute = routePath === '/register';
  const isAuthRoute = isLoginRoute || isRegisterRoute;
  const isPortalRoute = routePath === '/portal';
  const isAdminRoute = routePath === '/admin';
  const isProtectedRoute = isPortalRoute || isAdminRoute;
  const authRouteTab: AuthTab = isRegisterRoute ? 'register' : 'login';
  const shouldShowClientPortal = currentUser?.role === 'client' && isPortalRoute && Boolean(currentClientSession);
  const shouldShowAdminPortal = currentUser?.role === 'admin' && isAdminRoute;
  const isLandingView = !shouldShowClientPortal && !shouldShowAdminPortal;

  useEffect(() => {
    savePortalStore(store);
  }, [store]);

  useEffect(() => {
    let isCancelled = false;

    async function hydrateSharedStore() {
      const sharedStore = await loadSharedPortalStore();

      if (isCancelled) return;

      if (!sharedStore) {
        setIsSharedStoreReady(true);
        setIsSharedStoreAvailable(false);
        return;
      }

      const localStore = loadPortalStore();
      const shouldMigrateLocalClients = !hasMigratedSharedPortalStore();
      const nextStore = shouldMigrateLocalClients
        ? mergePortalStoresForSharedMigration(localStore, sharedStore)
        : applySharedPortalStore(localStore, sharedStore);

      savePortalStore(nextStore);
      setStore((prev) => (arePortalStoresEqual(prev, nextStore) ? prev : nextStore));
      setIsSharedStoreAvailable(true);
      setIsSharedStoreReady(true);

      if (shouldMigrateLocalClients) {
        markSharedPortalStoreMigrated();
        void saveSharedPortalStore(nextStore);
      }
    }

    void hydrateSharedStore();

    return () => {
      isCancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!isSharedStoreReady || !isSharedStoreAvailable) return;

    const saveTimer = window.setTimeout(() => {
      void saveSharedPortalStore(store);
    }, 350);

    return () => {
      window.clearTimeout(saveTimer);
    };
  }, [isSharedStoreAvailable, isSharedStoreReady, store]);

  useEffect(() => {
    if (!isSharedStoreAvailable) return;

    let isCancelled = false;

    async function refreshSharedStore() {
      const sharedStore = await loadSharedPortalStore();
      if (isCancelled || !sharedStore) return;

      setStore((prev) => {
        const nextStore = applySharedPortalStore(prev, sharedStore);
        return arePortalStoresEqual(prev, nextStore) ? prev : nextStore;
      });
    }

    const refreshInterval = window.setInterval(() => {
      void refreshSharedStore();
    }, 5000);

    return () => {
      isCancelled = true;
      window.clearInterval(refreshInterval);
    };
  }, [isSharedStoreAvailable]);

  useEffect(() => {
    if (!currentUser) {
      if (isProtectedRoute) {
        navigate('/login', { replace: true });
      }
      return;
    }

    if (isAuthRoute) {
      navigate(currentUser.role === 'admin' ? '/admin' : '/portal', { replace: true });
      return;
    }

    if (currentUser.role === 'admin' && isPortalRoute) {
      navigate('/admin', { replace: true });
      return;
    }

    if (currentUser.role === 'client' && isAdminRoute) {
      navigate('/portal', { replace: true });
    }
  }, [
    currentUser,
    isAdminRoute,
    isAuthRoute,
    isPortalRoute,
    isProtectedRoute,
    navigate,
  ]);

  useEffect(() => {
    if (currentUser?.role !== 'client') {
      setSelectedProjectId(null);
      return;
    }

    const activeSession = getActiveClientSession(store);
    if (!activeSession) {
      setSelectedProjectId(null);
      return;
    }

    const projectExists = activeSession.projects.some((project) => project.id === selectedProjectId);
    if (!projectExists) {
      setSelectedProjectId(activeSession.projects[0]?.id ?? null);
    }
  }, [currentUser?.id, currentUser?.role, selectedProjectId, store]);

  useEffect(() => {
    if (currentUser?.role !== 'admin') {
      setSelectedAdminClientId(null);
      setSelectedAdminProjectId(null);
      return;
    }

    const firstClient = store.clients[0] ?? null;
    if (!firstClient) {
      setSelectedAdminClientId(null);
      setSelectedAdminProjectId(null);
      return;
    }

    const selectedClient = getClientSessionById(store, selectedAdminClientId) ?? firstClient;
    if (selectedClient.user.id !== selectedAdminClientId) {
      setSelectedAdminClientId(selectedClient.user.id);
      setSelectedAdminProjectId(selectedClient.projects[0]?.id ?? null);
      return;
    }

    const projectExists = selectedClient.projects.some((project) => project.id === selectedAdminProjectId);
    if (!projectExists) {
      setSelectedAdminProjectId(selectedClient.projects[0]?.id ?? null);
    }
  }, [currentUser?.role, selectedAdminClientId, selectedAdminProjectId, store]);

  useEffect(() => {
    if (
      currentUser?.role === 'client' &&
      currentUser.id &&
      selectedProjectId &&
      isChatOpen
    ) {
      markClientProjectAsRead(currentUser.id, selectedProjectId);
    }
  }, [currentUser, isChatOpen, selectedProjectId]);

  function markClientProjectAsRead(clientId: string, projectId: string) {
    const updatedAt = new Date().toISOString();

    setStore((prev) => ({
      ...prev,
      clients: prev.clients.map((client) =>
        client.user.id === clientId
          ? {
              ...client,
              updatedAt,
              projects: client.projects.map((project) =>
                project.id === projectId ? { ...project, unreadCount: 0, updatedAt } : project,
              ),
            }
          : client,
      ),
    }));
  }

  async function handleAuthSuccess(payload: AuthSuccessPayload) {
    const syncedStore = await loadSyncedPortalStore();
    const nextStore = applyAuthToStore(syncedStore, payload);

    savePortalStore(nextStore);
    setStore(nextStore);
    const isSavedToSharedStore = await saveSharedPortalStore(nextStore);

    if (!isSavedToSharedStore) {
      toast.warning('Серверное хранилище кабинета недоступно', {
        description:
          'Данные сохранены в этом браузере. Для общей админ-панели проверьте PHP-обработчик /auth/portal-store.php.',
      });
    }

    navigate(payload.role === 'admin' ? '/admin' : '/portal');
    setSelectedProjectId(null);
    setSelectedAdminClientId(null);
    setSelectedAdminProjectId(null);
    setIsChatOpen(false);

    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function handleLogout() {
    setStore((prev) => clearCurrentUser(prev));
    navigate('/');
    setSelectedProjectId(null);
    setSelectedAdminClientId(null);
    setSelectedAdminProjectId(null);
    setIsChatOpen(false);

    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function handleClientSelectProject(projectId: string) {
    setSelectedProjectId(projectId);

    if (currentUser?.role === 'client') {
      markClientProjectAsRead(currentUser.id, projectId);
    }
  }

  function handleClientOpenChat(projectId?: string) {
    if (currentUser?.role !== 'client') return;

    navigate('/portal');

    if (projectId) {
      handleClientSelectProject(projectId);
    }

    setIsChatOpen(true);
  }

  function handleTopbarChatAction() {
    if (currentUser?.role === 'admin') {
      navigate('/admin');
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          document.getElementById('кабинет-чат')?.scrollIntoView({ behavior: 'smooth' });
        });
      });
      return;
    }

    handleClientOpenChat(selectedProjectId ?? undefined);
  }

  function handleGoHome() {
    navigate('/');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function handleOpenPortal() {
    if (!currentUser) return;

    navigate(currentUser.role === 'admin' ? '/admin' : '/portal');
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        document.getElementById('кабинет-сводка')?.scrollIntoView({ behavior: 'smooth' });
      });
    });
  }

  function addProjectToClient(
    clientId: string,
    input: CreateProjectInput,
    options?: { clearLeadGoal?: boolean },
  ) {
    const clientSession = getClientSessionById(store, clientId);
    if (!clientSession) return null;

    const project = createProjectFromInput(input);
    const messages = createMessagesForProject(project, clientSession.user);

    setStore((prev) => ({
      ...prev,
      clients: prev.clients.map((client) =>
        client.user.id === clientId
          ? {
              ...client,
              updatedAt: project.updatedAt,
              projects: [project, ...client.projects],
              messages: [...client.messages, ...messages],
              leadGoal: options?.clearLeadGoal ? undefined : client.leadGoal,
            }
          : client,
      ),
    }));

    return project;
  }

  function handleCreateProject(input: CreateProjectInput) {
    if (currentUser?.role !== 'client' || !currentClientSession) return;

    const project = addProjectToClient(currentClientSession.user.id, input);
    if (!project) return;

    setSelectedProjectId(project.id);
    setIsChatOpen(true);
  }

  function deleteMessageFromClient(clientId: string, messageId: string) {
    const clientSession = getClientSessionById(store, clientId);
    if (!clientSession) return null;

    const messageToDelete = clientSession.messages.find((message) => message.id === messageId);
    if (!messageToDelete) return null;

    setStore((prev) => ({
      ...prev,
      deletedMessageIds: appendUniqueId(prev.deletedMessageIds, messageId),
      clients: prev.clients.map((client) => {
        if (client.user.id !== clientId) return client;

        const remainingMessages = client.messages.filter((message) => message.id !== messageId);
        const updatedAt = new Date().toISOString();

        return {
          ...client,
          updatedAt,
          messages: remainingMessages,
          projects: client.projects.map((project) =>
            project.id === messageToDelete.projectId
              ? {
                  ...project,
                  unreadCount:
                    messageToDelete.author === 'manager'
                      ? Math.max(0, project.unreadCount - 1)
                      : project.unreadCount,
                  updatedAt: getLatestProjectMessageTimestamp(
                    remainingMessages,
                    project.id,
                    project.updatedAt,
                  ),
                }
              : project,
          ),
        };
      }),
    }));

    return messageToDelete;
  }

  function editMessageForClient(
    clientId: string,
    messageId: string,
    text: string,
    editedByName: string,
  ) {
    const clientSession = getClientSessionById(store, clientId);
    if (!clientSession) return null;

    const messageToEdit = clientSession.messages.find((message) => message.id === messageId);
    if (!messageToEdit || messageToEdit.author === 'system') return null;

    const normalizedText = text.trim();
    if (!normalizedText) return null;

    const editedAt = new Date().toISOString();

    setStore((prev) => ({
      ...prev,
      clients: prev.clients.map((client) =>
        client.user.id === clientId
          ? {
              ...client,
              updatedAt: editedAt,
              messages: client.messages.map((message) =>
                message.id === messageId
                  ? {
                      ...message,
                      text: normalizedText,
                      editedAt,
                      editedByName,
                    }
                  : message,
              ),
              projects: client.projects.map((project) =>
                project.id === messageToEdit.projectId
                  ? {
                      ...project,
                      updatedAt: editedAt,
                    }
                  : project,
              ),
            }
          : client,
      ),
    }));

    return {
      ...messageToEdit,
      text: normalizedText,
      editedAt,
      editedByName,
    } satisfies PortalMessage;
  }

  function handleLandingServiceOrder(offer: ServiceCatalogOffer) {
    if (currentUser?.role !== 'client' || !currentClientSession) {
      toast.error('Сначала войдите как клиент', {
        description: 'После входа заказ из услуг сразу добавится в кабинет и станет виден администратору.',
      });
      return;
    }

    const project = addProjectToClient(currentClientSession.user.id, {
      name: `Заявка: ${offer.title}`,
      service: offer.title,
      budget: offer.price,
      deadline: '',
      brief: `${offer.categoryTitle}. ${offer.summary} Источник: заказ со страницы услуг.`,
    });

    if (!project) return;

    navigate('/portal');
    setSelectedProjectId(project.id);
    setIsChatOpen(false);

    toast.success('Услуга добавлена в кабинет', {
      description: `Проект "${project.name}" уже доступен клиенту и появится в админ-панели.`,
    });

    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        document.getElementById('кабинет-проекты')?.scrollIntoView({ behavior: 'smooth' });
      });
    });
  }

  function handleOpenAuth(tab: AuthTab) {
    navigate(tab === 'register' ? '/register' : '/login');
  }

  function handleAuthDialogOpenChange(open: boolean) {
    if (!open && isAuthRoute) {
      navigate('/');
    }
  }

  function handleClientSendMessage(projectId: string, input: ComposePortalMessageInput) {
    if (currentUser?.role !== 'client' || !currentClientSession) return;

    const text = input.text.trim();
    if (!text) return;

    const createdAt = new Date().toISOString();
    const replySnapshot = input.replyToMessage ? createReplySnapshot(input.replyToMessage) : {};

    setStore((prev) => ({
      ...prev,
      clients: prev.clients.map((client) =>
        client.user.id === currentClientSession.user.id
          ? {
              ...client,
              updatedAt: createdAt,
              projects: client.projects.map((project) =>
                project.id === projectId ? { ...project, updatedAt: createdAt } : project,
              ),
              messages: [
                ...client.messages,
                {
                  id: createPortalId('message'),
                  projectId,
                  author: 'client',
                  authorName: currentClientSession.user.name,
                  text,
                  createdAt,
                  ...replySnapshot,
                } satisfies PortalMessage,
              ],
            }
          : client,
      ),
    }));
  }

  function handleClientDeleteMessage(messageId: string) {
    if (currentUser?.role !== 'client' || !currentClientSession) return;

    const messageToDelete = currentClientSession.messages.find((message) => message.id === messageId);
    if (!messageToDelete || messageToDelete.author !== 'client') return;

    deleteMessageFromClient(currentClientSession.user.id, messageId);
  }

  function handleAdminSelectClient(clientId: string) {
    const selectedClient = getClientSessionById(store, clientId);
    setSelectedAdminClientId(clientId);
    setSelectedAdminProjectId(selectedClient?.projects[0]?.id ?? null);
  }

  function handleAdminSelectProject(clientId: string, projectId: string) {
    setSelectedAdminClientId(clientId);
    setSelectedAdminProjectId(projectId);
  }

  function handleAdminSendMessage(
    clientId: string,
    projectId: string,
    input: ComposePortalMessageInput,
  ) {
    if (currentUser?.role !== 'admin') return;

    const text = input.text.trim();
    if (!text) return;

    const createdAt = new Date().toISOString();
    const replySnapshot = input.replyToMessage ? createReplySnapshot(input.replyToMessage) : {};

    setStore((prev) => ({
      ...prev,
      clients: prev.clients.map((client) =>
        client.user.id === clientId
          ? {
              ...client,
              updatedAt: createdAt,
              projects: client.projects.map((project) =>
                project.id === projectId
                  ? {
                      ...project,
                      updatedAt: createdAt,
                      unreadCount: project.unreadCount + 1,
                    }
                  : project,
              ),
              messages: [
                ...client.messages,
                {
                  id: createPortalId('message'),
                  projectId,
                  author: 'manager',
                  authorName: currentUser.name,
                  text,
                  createdAt,
                  ...replySnapshot,
                } satisfies PortalMessage,
              ],
            }
          : client,
      ),
    }));
  }

  function handleAdminDeleteMessage(clientId: string, messageId: string) {
    if (currentUser?.role !== 'admin') return;

    const clientSession = getClientSessionById(store, clientId);
    const messageToDelete = clientSession?.messages.find((message) => message.id === messageId);
    if (!messageToDelete || messageToDelete.author !== 'manager') return;

    deleteMessageFromClient(clientId, messageId);
  }

  function handleAdminEditMessage(clientId: string, messageId: string, text: string) {
    if (currentUser?.role !== 'admin') return null;

    return editMessageForClient(clientId, messageId, text, currentUser.name);
  }

  function handleAdminDeleteProject(clientId: string, projectId: string) {
    if (currentUser?.role !== 'admin') return;

    setStore((prev) => ({
      ...prev,
      deletedProjectIds: appendUniqueId(prev.deletedProjectIds, projectId),
      clients: prev.clients.map((client) =>
        client.user.id === clientId
          ? {
              ...client,
              updatedAt: new Date().toISOString(),
              projects: client.projects.filter((project) => project.id !== projectId),
              messages: client.messages.filter((message) => message.projectId !== projectId),
            }
          : client,
      ),
      deletedMessageIds: appendUniqueIds(
        prev.deletedMessageIds,
        prev.clients
          .find((client) => client.user.id === clientId)
          ?.messages.filter((message) => message.projectId === projectId)
          .map((message) => message.id) ?? [],
      ),
    }));

    if (selectedAdminProjectId === projectId) {
      setSelectedAdminProjectId(null);
    }
  }

  function handleAdminSetProjectCompleted(
    clientId: string,
    projectId: string,
    completed: boolean,
  ) {
    if (currentUser?.role !== 'admin') return;

    const updatedAt = new Date().toISOString();

    setStore((prev) => ({
      ...prev,
      clients: prev.clients.map((client) =>
        client.user.id === clientId
          ? {
              ...client,
              updatedAt,
              projects: client.projects.map((project) => {
                if (project.id !== projectId) return project;

                const isCurrentlyCompleted = project.status === 'Запущен';

                return {
                  ...project,
                  status: completed ? 'Запущен' : isCurrentlyCompleted ? 'В работе' : project.status,
                  progress: completed ? 100 : project.progress === 100 ? 82 : project.progress,
                  updatedAt,
                  unreadCount: completed ? 0 : project.unreadCount,
                  nextStep: completed
                    ? 'Проект завершён и передан клиенту.'
                    : isCurrentlyCompleted
                      ? 'Доработать задачи и подготовить финальную передачу проекта'
                      : project.nextStep,
                };
              }),
            }
          : client,
      ),
    }));
  }

  function handleAdminAssignProject(clientId: string, input: CreateProjectInput) {
    if (currentUser?.role !== 'admin') return;

    const project = addProjectToClient(clientId, input, { clearLeadGoal: true });
    if (!project) return;

    setSelectedAdminClientId(clientId);
    setSelectedAdminProjectId(project.id);
  }

  function handleAdminUpdateClientProfile(
    clientId: string,
    input: {
      name: string;
      email: string;
      phone: string;
      password: string;
    },
  ) {
    if (currentUser?.role !== 'admin') return;

    const normalizedEmail = normalizeEmail(input.email);
    const normalizedPhone = normalizePhone(input.phone);
    const trimmedPassword = input.password.trim();

    if (
      normalizedEmail &&
      normalizedEmail !== normalizeEmail(ADMIN_EMAIL) &&
      store.clients.some(
        (client) => client.user.id !== clientId && normalizeEmail(client.user.email) === normalizedEmail,
      )
    ) {
      return { ok: false as const, error: 'Эта почта уже используется другим пользователем.' };
    }

    if (
      normalizedPhone &&
      store.clients.some(
        (client) => client.user.id !== clientId && normalizePhone(client.user.phone) === normalizedPhone,
      )
    ) {
      return { ok: false as const, error: 'Этот телефон уже используется другим пользователем.' };
    }

    if (normalizedEmail === normalizeEmail(ADMIN_EMAIL)) {
      return { ok: false as const, error: 'Почта администратора зарезервирована и недоступна для клиента.' };
    }

    setStore((prev) => ({
      ...prev,
      clients: prev.clients.map((client) =>
        client.user.id === clientId
          ? {
              ...client,
              updatedAt: new Date().toISOString(),
              user: {
                ...client.user,
                name: input.name.trim() || client.user.name,
                email: normalizedEmail || client.user.email,
                phone: normalizedPhone || undefined,
              },
              authPassword: trimmedPassword || client.authPassword,
            }
          : client,
      ),
    }));

    return { ok: true as const };
  }

  function handleAdminDeleteClient(clientId: string) {
    if (currentUser?.role !== 'admin') return;

    setStore((prev) => ({
      ...prev,
      deletedClientIds: appendUniqueId(prev.deletedClientIds, clientId),
      deletedProjectIds: appendUniqueIds(
        prev.deletedProjectIds,
        prev.clients.find((client) => client.user.id === clientId)?.projects.map((project) => project.id) ?? [],
      ),
      deletedMessageIds: appendUniqueIds(
        prev.deletedMessageIds,
        prev.clients.find((client) => client.user.id === clientId)?.messages.map((message) => message.id) ?? [],
      ),
      clients: prev.clients.filter((client) => client.user.id !== clientId),
    }));

    if (selectedAdminClientId === clientId) {
      setSelectedAdminClientId(null);
      setSelectedAdminProjectId(null);
    }
  }

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
      <div className="min-h-screen bg-black overflow-x-hidden scroll-smooth">
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

        <Navbar
          user={currentUser}
          isLandingView={isLandingView}
          onOpenAuth={handleOpenAuth}
          onGoHome={handleGoHome}
          onOpenPortal={handleOpenPortal}
          onOpenChat={handleTopbarChatAction}
          onLogout={handleLogout}
        />

        {!currentUser && (
          <AuthDialog
            open={isAuthRoute}
            onOpenChange={handleAuthDialogOpenChange}
            initialTab={authRouteTab}
            onAuthSuccess={handleAuthSuccess}
          />
        )}

        {shouldShowAdminPortal ? (
          <AdminDashboard
            store={store}
            selectedClientId={selectedAdminClientId}
            selectedProjectId={selectedAdminProjectId}
            onSelectClient={handleAdminSelectClient}
            onSelectProject={handleAdminSelectProject}
            onAssignProject={handleAdminAssignProject}
            onUpdateClientProfile={handleAdminUpdateClientProfile}
            onDeleteClient={handleAdminDeleteClient}
            onSendMessage={handleAdminSendMessage}
            onDeleteMessage={handleAdminDeleteMessage}
            onEditMessage={handleAdminEditMessage}
            onDeleteProject={handleAdminDeleteProject}
            onSetProjectCompleted={handleAdminSetProjectCompleted}
          />
        ) : shouldShowClientPortal && currentClientSession ? (
          <>
            <ClientDashboard
              session={currentClientSession}
              selectedProjectId={selectedProjectId}
              onSelectProject={handleClientSelectProject}
              onCreateProject={handleCreateProject}
              onOpenChat={handleClientOpenChat}
            />
            <ClientChatWidget
              user={currentClientSession.user}
              projects={currentClientSession.projects}
              messages={currentClientSession.messages}
              selectedProjectId={selectedProjectId}
              isOpen={isChatOpen}
              onOpenChange={setIsChatOpen}
              onSelectProject={handleClientSelectProject}
              onSendMessage={handleClientSendMessage}
              onDeleteMessage={handleClientDeleteMessage}
            />
          </>
        ) : (
          <>
            <Hero />
            <About />
            <Services
              canOrderDirectly={currentUser?.role === 'client' && Boolean(currentClientSession)}
              onOrderOffer={handleLandingServiceOrder}
            />
            <Portfolio />
            <Contact />
            <SupportChatWidget />
          </>
        )}

        <Footer />
        <ScrollToTopButton />
      </div>
    </MotionConfig>
  );
}
