import { useEffect, useState, type FormEvent } from 'react';
import { ArrowLeft, Eye, EyeOff, Mail, ShieldCheck } from 'lucide-react';
import { toast } from 'sonner';

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from './ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Button } from './ui/button';
import { Textarea } from './ui/textarea';
import {
  CONTACT_EMAIL,
  CONTACT_TELEGRAM,
  submitContactSubmission,
} from '../lib/contact';
import {
  ADMIN_EMAIL,
  findClientSession,
  inferNameFromEmail,
  isAdminCredentials,
  loadSyncedPortalStore,
  savePortalStore,
  saveSharedPortalStore,
  setClientPassword,
  type AuthSuccessPayload,
  type LoginMethod,
} from '../lib/clientPortal';
import {
  clearPasswordRecoveryState,
  generatePasswordRecoveryCode,
  maskRecoveryEmail,
  sendPasswordRecoveryCode,
  storePasswordRecoveryCode,
  verifyPasswordRecoveryCode,
} from '../lib/passwordRecovery';

export type AuthTab = 'login' | 'register';
type AuthScreen = 'auth' | 'recovery-request' | 'recovery-verify';

interface AuthDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialTab: AuthTab;
  onAuthSuccess: (payload: AuthSuccessPayload) => void;
}

const authFieldClassName =
  'mt-2 h-11 rounded-2xl border-white/10 bg-white/6 px-4 text-sm text-white placeholder:text-white/35 focus-visible:border-blue-400/50 focus-visible:ring-blue-400/20';

const authTextareaClassName =
  'mt-2 min-h-28 rounded-2xl border-white/10 bg-white/6 px-4 py-3 text-sm text-white placeholder:text-white/35 focus-visible:border-blue-400/50 focus-visible:ring-blue-400/20';

export function AuthDialog({ open, onOpenChange, initialTab, onAuthSuccess }: AuthDialogProps) {
  const [authScreen, setAuthScreen] = useState<AuthScreen>('auth');
  const [activeTab, setActiveTab] = useState<AuthTab>(initialTab);
  const [loginMethod, setLoginMethod] = useState<LoginMethod>('email');
  const [isLeadSubmitting, setIsLeadSubmitting] = useState(false);
  const [isRecoverySubmitting, setIsRecoverySubmitting] = useState(false);
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPhone, setLoginPhone] = useState('');
  const [registerName, setRegisterName] = useState('');
  const [registerEmail, setRegisterEmail] = useState('');
  const [registerPhone, setRegisterPhone] = useState('');
  const [registerPassword, setRegisterPassword] = useState('');
  const [registerPasswordConfirm, setRegisterPasswordConfirm] = useState('');
  const [isLoginPasswordVisible, setIsLoginPasswordVisible] = useState(false);
  const [isRegisterPasswordVisible, setIsRegisterPasswordVisible] = useState(false);
  const [isRegisterPasswordConfirmVisible, setIsRegisterPasswordConfirmVisible] = useState(false);
  const [recoveryEmail, setRecoveryEmail] = useState('');
  const [recoveryCode, setRecoveryCode] = useState('');
  const [recoveryPassword, setRecoveryPassword] = useState('');
  const [recoveryPasswordConfirm, setRecoveryPasswordConfirm] = useState('');
  const [isRecoveryPasswordVisible, setIsRecoveryPasswordVisible] = useState(false);
  const [isRecoveryPasswordConfirmVisible, setIsRecoveryPasswordConfirmVisible] = useState(false);

  useEffect(() => {
    if (open) {
      setAuthScreen('auth');
      setActiveTab(initialTab);
      setLoginMethod('email');
      setIsLeadSubmitting(false);
      setIsRecoverySubmitting(false);
      setLoginEmail('');
      setLoginPhone('');
      setRegisterName('');
      setRegisterEmail('');
      setRegisterPhone('');
      setRegisterPassword('');
      setRegisterPasswordConfirm('');
      setIsLoginPasswordVisible(false);
      setIsRegisterPasswordVisible(false);
      setIsRegisterPasswordConfirmVisible(false);
      setRecoveryEmail('');
      setRecoveryCode('');
      setRecoveryPassword('');
      setRecoveryPasswordConfirm('');
      setIsRecoveryPasswordVisible(false);
      setIsRecoveryPasswordConfirmVisible(false);
    }
  }, [initialTab, open]);

  async function handleLoginSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const formData = new FormData(event.currentTarget);
    const email = loginEmail.trim() || String(formData.get('email') ?? '').trim();
    const phone = loginPhone.trim() || String(formData.get('phone') ?? '').trim();
    const password = String(formData.get('password') ?? '').trim();
    const identifier = loginMethod === 'email' ? email : phone;
    const normalizedName =
      loginMethod === 'email' ? inferNameFromEmail(email) : phone ? `Клиент ${phone.slice(-4)}` : 'Клиент DualStack';
    const isAdmin = loginMethod === 'email' && isAdminCredentials(email, password);
    const store = await loadSyncedPortalStore();
    const existingClient = !isAdmin ? findClientSession(store, { email, phone }) : null;
    const isLegacyPasswordSetup = Boolean(existingClient && !existingClient.authPassword);

    if (
      loginMethod === 'email' &&
      email.trim().toLowerCase() === ADMIN_EMAIL.toLowerCase() &&
      !isAdmin
    ) {
      toast.error('Неверный пароль администратора');
      return;
    }

    if (!isAdmin) {
      if (!existingClient) {
        setRegisterName(loginMethod === 'email' ? inferNameFromEmail(email) : '');
        setRegisterEmail(email);
        setRegisterPhone(phone);
        setRegisterPassword(password);
        setRegisterPasswordConfirm(password);
        setActiveTab('register');
        toast.error('Аккаунт не найден', {
          description:
            loginMethod === 'email'
              ? 'Эта почта ещё не зарегистрирована. Открыл регистрацию и подставил данные.'
              : 'Этот телефон ещё не зарегистрирован. Открыл регистрацию и подставил номер.',
        });
        return;
      }

      if (existingClient.authPassword && existingClient.authPassword !== password) {
        toast.error('Неверный пароль', {
          description:
            loginMethod === 'email'
              ? 'Проверьте пароль для этой почты и попробуйте ещё раз.'
              : 'Проверьте пароль для этого телефона и попробуйте ещё раз.',
        });
        return;
      }
    }

    onAuthSuccess({
      mode: 'login',
      role: isAdmin ? 'admin' : 'client',
      loginMethod,
      user: {
        name: isAdmin ? 'Админ DualStack' : normalizedName,
        email,
        phone,
        password,
      },
    });

    toast.success(isAdmin ? 'Админ-вход выполнен' : 'Вход выполнен', {
      description: isAdmin
        ? 'Открываю админ-панель со всеми проектами и чатами.'
        : isLegacyPasswordSetup
          ? `Открываю профиль для ${identifier}. Этот пароль сохранён для следующих входов.`
          : `Открываю профиль для ${identifier}.`,
    });

    onOpenChange(false);
  }

  function handleOpenRecovery() {
    setAuthScreen('recovery-request');
    setRecoveryEmail(loginEmail.trim());
    setRecoveryCode('');
    setRecoveryPassword('');
    setRecoveryPasswordConfirm('');
    setIsRecoveryPasswordVisible(false);
    setIsRecoveryPasswordConfirmVisible(false);
  }

  function handleCloseRecovery() {
    setAuthScreen('auth');
    setRecoveryCode('');
    setRecoveryPassword('');
    setRecoveryPasswordConfirm('');
    setIsRecoveryPasswordVisible(false);
    setIsRecoveryPasswordConfirmVisible(false);
  }

  async function handleRecoveryRequestSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const normalizedEmail = recoveryEmail.trim();

    if (!normalizedEmail) {
      toast.error('Введите email для восстановления');
      return;
    }

    if (normalizedEmail.toLowerCase() === ADMIN_EMAIL.toLowerCase()) {
      toast.error('Сброс пароля администратора здесь недоступен');
      return;
    }

    const store = await loadSyncedPortalStore();
    const existingClient = findClientSession(store, { email: normalizedEmail });

    if (!existingClient) {
      toast.error('Аккаунт не найден', {
        description: 'Почта не найдена в базе кабинета. Проверьте email или зарегистрируйтесь заново.',
      });
      return;
    }

    const recoveryCodeValue = generatePasswordRecoveryCode();

    setIsRecoverySubmitting(true);

    try {
      await storePasswordRecoveryCode(existingClient.user.email, recoveryCodeValue);
      const delivery = await sendPasswordRecoveryCode(
        existingClient.user.email,
        recoveryCodeValue,
      );

      setRecoveryEmail(existingClient.user.email);
      setRecoveryCode('');
      setAuthScreen('recovery-verify');

      toast.success(
        delivery.mode === 'dev' ? 'Код создан для локальной проверки' : 'Код отправлен',
        {
          description:
            delivery.mode === 'dev'
              ? `Откройте консоль браузера: код выведен для ${existingClient.user.email}.`
              : `Письмо с кодом отправлено на ${maskRecoveryEmail(existingClient.user.email)}.`,
        },
      );
    } catch {
      clearPasswordRecoveryState();
      toast.error('Не удалось отправить код', {
        description: 'Проверьте работу почтового обработчика на хостинге и попробуйте ещё раз.',
      });
    } finally {
      setIsRecoverySubmitting(false);
    }
  }

  async function handleRecoveryResetSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!recoveryCode.trim()) {
      toast.error('Введите код из письма');
      return;
    }

    if (recoveryPassword.trim().length < 6) {
      toast.error('Пароль слишком короткий', {
        description: 'Минимальная длина нового пароля — 6 символов.',
      });
      return;
    }

    if (recoveryPassword.trim() !== recoveryPasswordConfirm.trim()) {
      toast.error('Пароли не совпадают');
      return;
    }

    setIsRecoverySubmitting(true);

    try {
      const verificationResult = await verifyPasswordRecoveryCode(
        recoveryEmail,
        recoveryCode,
      );

      if (verificationResult === 'missing') {
        toast.error('Сессия восстановления не найдена', {
          description: 'Запросите новый код и попробуйте ещё раз.',
        });
        setAuthScreen('recovery-request');
        return;
      }

      if (verificationResult === 'expired') {
        toast.error('Код истёк', {
          description: 'Запросите новый код для восстановления пароля.',
        });
        setAuthScreen('recovery-request');
        return;
      }

      if (verificationResult === 'invalid') {
        toast.error('Неверный код восстановления');
        return;
      }

      const store = await loadSyncedPortalStore();
      const updatedStore = setClientPassword(
        store,
        { email: recoveryEmail },
        recoveryPassword,
      );

      savePortalStore(updatedStore);
      void saveSharedPortalStore(updatedStore);
      clearPasswordRecoveryState();
      setLoginMethod('email');
      setLoginEmail(recoveryEmail);
      setLoginPhone('');
      setActiveTab('login');
      handleCloseRecovery();

      toast.success('Пароль обновлён', {
        description: 'Теперь можно войти в кабинет с новым паролем.',
      });
    } finally {
      setIsRecoverySubmitting(false);
    }
  }

  async function handleLeadSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const formData = new FormData(event.currentTarget);
    const name = String(formData.get('name') ?? '').trim();
    const email = String(formData.get('email') ?? '').trim();
    const phone = String(formData.get('phone') ?? '').trim();
    const goal = String(formData.get('goal') ?? '').trim();
    const password = registerPassword.trim();
    const passwordConfirm = registerPasswordConfirm.trim();

    if (!name || !email || !goal) {
      toast.error('Заполните имя, email и цель обращения');
      return;
    }

    if (email.trim().toLowerCase() === ADMIN_EMAIL.toLowerCase()) {
      toast.error('Этот email занят администратором', {
        description: 'Используйте другой email для регистрации клиента.',
      });
      return;
    }

    if (password.length < 6) {
      toast.error('Пароль слишком короткий', {
        description: 'Минимальная длина пароля — 6 символов.',
      });
      return;
    }

    if (password !== passwordConfirm) {
      toast.error('Пароли не совпадают');
      return;
    }

    const store = await loadSyncedPortalStore();
    const existingClient = findClientSession(store, { email, phone });

    if (existingClient) {
      setLoginMethod(email ? 'email' : 'phone');
      setLoginEmail(email);
      setLoginPhone(phone);
      setActiveTab('login');
      toast.error('Аккаунт уже зарегистрирован', {
        description: email
          ? 'Эта почта уже используется. Войдите в кабинет через вкладку входа.'
          : 'Этот номер уже используется. Войдите в кабинет через вкладку входа.',
      });
      return;
    }

    setIsLeadSubmitting(true);

    onAuthSuccess({
      mode: 'register',
      role: 'client',
      user: {
        name,
        email,
        phone,
        password,
      },
      leadGoal: goal,
    });

    toast.success('Регистрация выполнена', {
      description: 'Профиль создан и личный кабинет уже открыт.',
    });

    setRegisterName('');
    setRegisterEmail('');
    setRegisterPhone('');
    setRegisterPassword('');
    setRegisterPasswordConfirm('');
    setLoginEmail('');
    setLoginPhone('');
    event.currentTarget.reset();
    setIsLeadSubmitting(false);
    onOpenChange(false);

    void submitContactSubmission({
      name,
      email,
      phone,
      message: goal,
      subject: 'Новый лид из вкладки регистрации на сайте DualStack',
      source: 'Лид-магнит в хедере сайта',
      details: {
        form_type: 'Быстрый лид-магнит',
        next_step: 'Связаться и перевести лид в CRM или мессенджер',
      },
    })
      .then(() => {
        toast.success('Контакты отправлены', {
          description: `Лид ушёл на ${CONTACT_EMAIL}, дальше можно вести клиента в ${CONTACT_TELEGRAM}.`,
        });
      })
      .catch(() => {
        toast.error('Профиль создан, но контакты не отправились', {
          description: `При необходимости свяжитесь с клиентом вручную через ${CONTACT_EMAIL}.`,
        });
      });
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[calc(100dvh-1rem)] overflow-y-auto overflow-x-hidden border border-white/10 bg-[#050816]/95 p-0 text-white shadow-2xl shadow-blue-950/30 backdrop-blur-xl sm:max-h-[90vh] sm:max-w-[34rem]">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(96,165,250,0.18),transparent_30%),radial-gradient(circle_at_bottom_left,rgba(168,85,247,0.16),transparent_28%)]" />

        <div className="relative">
          <div className="border-b border-white/10 px-6 py-6 sm:px-8">
            <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/6 px-3 py-1 text-xs uppercase tracking-[0.24em] text-white/55">
              <ShieldCheck className="h-3.5 w-3.5" />
              Личный кабинет
            </div>

            <DialogHeader className="gap-3 text-left">
              <DialogTitle className="text-2xl font-semibold text-white">
                {authScreen === 'auth' ? 'Вход и регистрация' : 'Восстановление пароля'}
              </DialogTitle>
            </DialogHeader>
          </div>

          {authScreen === 'auth' ? (
            <Tabs
              value={activeTab}
              onValueChange={(value) => setActiveTab(value as AuthTab)}
              className="gap-6 px-6 py-6 sm:px-8 sm:py-7"
            >
              <TabsList className="grid h-auto w-full grid-cols-2 rounded-full border border-white/10 bg-white/6 p-1">
                <TabsTrigger
                  value="login"
                  className="rounded-full px-4 py-2 text-sm text-white/70 data-[state=active]:border-white/10 data-[state=active]:bg-white data-[state=active]:text-slate-950"
                >
                  Вход
                </TabsTrigger>
                <TabsTrigger
                  value="register"
                  className="rounded-full px-4 py-2 text-sm text-white/70 data-[state=active]:border-white/10 data-[state=active]:bg-white data-[state=active]:text-slate-950"
                >
                  Регистрация
                </TabsTrigger>
              </TabsList>

              <TabsContent value="login" className="mt-0">
                <form className="space-y-4" onSubmit={handleLoginSubmit}>
                  <div>
                    <p className="text-sm text-white/72">Выберите способ входа</p>
                    <div className="mt-2 grid grid-cols-2 rounded-full border border-white/10 bg-white/6 p-1">
                      {[
                        { value: 'email' as const, label: 'Через почту' },
                        { value: 'phone' as const, label: 'Через телефон' },
                      ].map((item) => (
                        <button
                          key={item.value}
                          type="button"
                          onClick={() => setLoginMethod(item.value)}
                          className={`rounded-full px-4 py-2 text-sm transition-colors ${
                            loginMethod === item.value
                              ? 'bg-white text-slate-950'
                              : 'text-white/70 hover:text-white'
                          }`}
                        >
                          {item.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {loginMethod === 'email' ? (
                    <div>
                      <Label htmlFor="login-email" className="text-sm text-white/80">
                        Email
                      </Label>
                      <Input
                        id="login-email"
                        name="email"
                        type="email"
                        autoComplete="email"
                        placeholder="you@company.com"
                        className={authFieldClassName}
                        value={loginEmail}
                        onChange={(event) => setLoginEmail(event.target.value)}
                        required
                      />
                    </div>
                  ) : (
                    <div>
                      <Label htmlFor="login-phone" className="text-sm text-white/80">
                        Телефон
                      </Label>
                      <Input
                        id="login-phone"
                        name="phone"
                        type="tel"
                        autoComplete="tel"
                        placeholder="+7 (999) 123-45-67"
                        className={authFieldClassName}
                        value={loginPhone}
                        onChange={(event) => setLoginPhone(event.target.value)}
                        required
                      />
                    </div>
                  )}

                  <div>
                    <div className="flex items-center justify-between gap-3">
                      <Label htmlFor="login-password" className="text-sm text-white/80">
                        Пароль
                      </Label>
                      <button
                        type="button"
                        onClick={handleOpenRecovery}
                        className="text-xs text-blue-200/75 transition-colors hover:text-blue-100"
                      >
                        Забыли пароль?
                      </button>
                    </div>
                    <div className="relative mt-2">
                      <Input
                        id="login-password"
                        name="password"
                        type={isLoginPasswordVisible ? 'text' : 'password'}
                        autoComplete="current-password"
                        placeholder="Введите пароль"
                        className={`${authFieldClassName} mt-0 pr-12`}
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setIsLoginPasswordVisible((prev) => !prev)}
                        className="absolute right-3 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full text-white/55 transition-colors hover:bg-white/8 hover:text-white"
                        aria-label={isLoginPasswordVisible ? 'Скрыть пароль' : 'Показать пароль'}
                      >
                        {isLoginPasswordVisible ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                  </div>

                  <Button
                    type="submit"
                    className="h-11 w-full rounded-2xl bg-gradient-to-r from-purple-600 via-blue-500 to-cyan-400 text-white shadow-lg shadow-blue-950/30 hover:opacity-95"
                  >
                    Войти
                  </Button>
                </form>
              </TabsContent>

              <TabsContent value="register" className="mt-0">
                <form className="space-y-4" onSubmit={handleLeadSubmit}>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div>
                      <Label htmlFor="register-name" className="text-sm text-white/80">
                        Имя
                      </Label>
                      <Input
                        id="register-name"
                        name="name"
                        type="text"
                        autoComplete="name"
                        placeholder="Алексей"
                        className={authFieldClassName}
                        value={registerName}
                        onChange={(event) => setRegisterName(event.target.value)}
                        required
                      />
                    </div>

                    <div>
                      <Label htmlFor="register-phone" className="text-sm text-white/80">
                        Телефон
                      </Label>
                      <Input
                        id="register-phone"
                        name="phone"
                        type="tel"
                        autoComplete="tel"
                        placeholder="+7 (999) 123-45-67"
                        className={authFieldClassName}
                        value={registerPhone}
                        onChange={(event) => setRegisterPhone(event.target.value)}
                      />
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="register-email" className="text-sm text-white/80">
                      Email
                    </Label>
                    <Input
                      id="register-email"
                      name="email"
                      type="email"
                      autoComplete="email"
                      placeholder="hello@brand.ru"
                      className={authFieldClassName}
                      value={registerEmail}
                      onChange={(event) => setRegisterEmail(event.target.value)}
                      required
                    />
                  </div>

                  <div className="grid gap-4 sm:grid-cols-2">
                    <div>
                      <Label htmlFor="register-password" className="text-sm text-white/80">
                        Пароль
                      </Label>
                      <div className="relative mt-2">
                        <Input
                          id="register-password"
                          name="register-password"
                          type={isRegisterPasswordVisible ? 'text' : 'password'}
                          autoComplete="new-password"
                          placeholder="Минимум 6 символов"
                          className={`${authFieldClassName} mt-0 pr-12`}
                          value={registerPassword}
                          onChange={(event) => setRegisterPassword(event.target.value)}
                          required
                        />
                        <button
                          type="button"
                          onClick={() => setIsRegisterPasswordVisible((prev) => !prev)}
                          className="absolute right-3 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full text-white/55 transition-colors hover:bg-white/8 hover:text-white"
                          aria-label={isRegisterPasswordVisible ? 'Скрыть пароль' : 'Показать пароль'}
                        >
                          {isRegisterPasswordVisible ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </button>
                      </div>
                    </div>

                    <div>
                      <Label htmlFor="register-password-confirm" className="text-sm text-white/80">
                        Повторите пароль
                      </Label>
                      <div className="relative mt-2">
                        <Input
                          id="register-password-confirm"
                          name="register-password-confirm"
                          type={isRegisterPasswordConfirmVisible ? 'text' : 'password'}
                          autoComplete="new-password"
                          placeholder="Повторите пароль"
                          className={`${authFieldClassName} mt-0 pr-12`}
                          value={registerPasswordConfirm}
                          onChange={(event) => setRegisterPasswordConfirm(event.target.value)}
                          required
                        />
                        <button
                          type="button"
                          onClick={() => setIsRegisterPasswordConfirmVisible((prev) => !prev)}
                          className="absolute right-3 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full text-white/55 transition-colors hover:bg-white/8 hover:text-white"
                          aria-label={isRegisterPasswordConfirmVisible ? 'Скрыть пароль' : 'Показать пароль'}
                        >
                          {isRegisterPasswordConfirmVisible ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </button>
                      </div>
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="register-goal" className="text-sm text-white/80">
                      Что нужно клиенту
                    </Label>
                    <Textarea
                      id="register-goal"
                      name="goal"
                      placeholder="Например: нужен сайт, SEO, брендинг или консультация"
                      className={authTextareaClassName}
                      required
                    />
                  </div>

                  <Button
                    type="submit"
                    disabled={isLeadSubmitting}
                    className="h-11 w-full rounded-2xl bg-white text-slate-950 hover:bg-slate-100 disabled:opacity-60"
                  >
                    {isLeadSubmitting ? 'Отправляем контакт...' : 'Получить консультацию'}
                  </Button>
                </form>
              </TabsContent>
            </Tabs>
          ) : authScreen === 'recovery-request' ? (
            <div className="space-y-5 px-6 py-6 sm:px-8 sm:py-7">
              <button
                type="button"
                onClick={handleCloseRecovery}
                className="inline-flex items-center gap-2 text-sm text-white/65 transition-colors hover:text-white"
              >
                <ArrowLeft className="h-4 w-4" />
                Назад ко входу
              </button>

              <div className="rounded-[1.6rem] border border-white/10 bg-white/6 p-4 text-sm text-white/72">
                Отправим код восстановления на email, который был использован при регистрации на этом устройстве.
              </div>

              <form className="space-y-4" onSubmit={handleRecoveryRequestSubmit}>
                <div>
                  <Label htmlFor="recovery-email" className="text-sm text-white/80">
                    Email для восстановления
                  </Label>
                  <div className="relative mt-2">
                    <Mail className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-white/38" />
                    <Input
                      id="recovery-email"
                      name="recovery-email"
                      type="email"
                      autoComplete="email"
                      placeholder="you@company.com"
                      className={`${authFieldClassName} mt-0 pl-11`}
                      value={recoveryEmail}
                      onChange={(event) => setRecoveryEmail(event.target.value)}
                      required
                    />
                  </div>
                </div>

                <Button
                  type="submit"
                  disabled={isRecoverySubmitting}
                  className="h-11 w-full rounded-2xl bg-white text-slate-950 hover:bg-slate-100 disabled:opacity-60"
                >
                  {isRecoverySubmitting ? 'Отправляем код...' : 'Отправить код'}
                </Button>
              </form>
            </div>
          ) : (
            <div className="space-y-5 px-6 py-6 sm:px-8 sm:py-7">
              <button
                type="button"
                onClick={() => setAuthScreen('recovery-request')}
                className="inline-flex items-center gap-2 text-sm text-white/65 transition-colors hover:text-white"
              >
                <ArrowLeft className="h-4 w-4" />
                Назад к отправке кода
              </button>

              <div className="rounded-[1.6rem] border border-white/10 bg-white/6 p-4 text-sm text-white/72">
                Код отправлен на {maskRecoveryEmail(recoveryEmail)}. Введите его и задайте новый пароль.
              </div>

              <form className="space-y-4" onSubmit={handleRecoveryResetSubmit}>
                <div>
                  <Label htmlFor="recovery-code" className="text-sm text-white/80">
                    Код из письма
                  </Label>
                  <Input
                    id="recovery-code"
                    name="recovery-code"
                    type="text"
                    inputMode="numeric"
                    autoComplete="one-time-code"
                    placeholder="6 цифр"
                    className={authFieldClassName}
                    value={recoveryCode}
                    onChange={(event) => setRecoveryCode(event.target.value.replace(/[^\d]/g, '').slice(0, 6))}
                    required
                  />
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <Label htmlFor="recovery-password" className="text-sm text-white/80">
                      Новый пароль
                    </Label>
                    <div className="relative mt-2">
                      <Input
                        id="recovery-password"
                        name="recovery-password"
                        type={isRecoveryPasswordVisible ? 'text' : 'password'}
                        autoComplete="new-password"
                        placeholder="Минимум 6 символов"
                        className={`${authFieldClassName} mt-0 pr-12`}
                        value={recoveryPassword}
                        onChange={(event) => setRecoveryPassword(event.target.value)}
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setIsRecoveryPasswordVisible((prev) => !prev)}
                        className="absolute right-3 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full text-white/55 transition-colors hover:bg-white/8 hover:text-white"
                        aria-label={isRecoveryPasswordVisible ? 'Скрыть пароль' : 'Показать пароль'}
                      >
                        {isRecoveryPasswordVisible ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="recovery-password-confirm" className="text-sm text-white/80">
                      Повторите пароль
                    </Label>
                    <div className="relative mt-2">
                      <Input
                        id="recovery-password-confirm"
                        name="recovery-password-confirm"
                        type={isRecoveryPasswordConfirmVisible ? 'text' : 'password'}
                        autoComplete="new-password"
                        placeholder="Повторите пароль"
                        className={`${authFieldClassName} mt-0 pr-12`}
                        value={recoveryPasswordConfirm}
                        onChange={(event) => setRecoveryPasswordConfirm(event.target.value)}
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setIsRecoveryPasswordConfirmVisible((prev) => !prev)}
                        className="absolute right-3 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full text-white/55 transition-colors hover:bg-white/8 hover:text-white"
                        aria-label={isRecoveryPasswordConfirmVisible ? 'Скрыть пароль' : 'Показать пароль'}
                      >
                        {isRecoveryPasswordConfirmVisible ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                  </div>
                </div>

                <div className="grid gap-3 sm:grid-cols-2">
                  <Button
                    type="submit"
                    disabled={isRecoverySubmitting}
                    className="h-11 w-full rounded-2xl bg-gradient-to-r from-purple-600 via-blue-500 to-cyan-400 text-white shadow-lg shadow-blue-950/30 hover:opacity-95"
                  >
                    {isRecoverySubmitting ? 'Сохраняем пароль...' : 'Сменить пароль'}
                  </Button>

                  <Button
                    type="button"
                    variant="outline"
                    disabled={isRecoverySubmitting}
                    onClick={() => setAuthScreen('recovery-request')}
                    className="h-11 w-full rounded-2xl border-white/10 bg-white/6 text-white hover:bg-white/10 hover:text-white"
                  >
                    Запросить код заново
                  </Button>
                </div>
              </form>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
