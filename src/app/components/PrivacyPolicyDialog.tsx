import type { ReactNode } from 'react';

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from './ui/dialog';

interface PrivacyPolicyDialogProps {
  children: ReactNode;
  triggerClassName?: string;
}

export function PrivacyPolicyDialog({
  children,
  triggerClassName,
}: PrivacyPolicyDialogProps) {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <button type="button" className={triggerClassName}>
          {children}
        </button>
      </DialogTrigger>
      <DialogContent className="max-h-[85vh] max-w-2xl overflow-y-auto border-white/10 bg-gray-950 text-white">
        <DialogHeader>
          <DialogTitle className="pr-8 text-2xl">Политика конфиденциальности</DialogTitle>
          <DialogDescription className="text-white/55">
            Последнее обновление: 20 июня 2026 года
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-5 text-sm leading-relaxed text-white/72 sm:text-base">
          <section>
            <h3 className="mb-2 font-semibold text-white">1. Какие данные мы получаем</h3>
            <p>
              При отправке формы DualStack получает указанные вами имя, email, телефон и
              сообщение о проекте.
            </p>
          </section>

          <section>
            <h3 className="mb-2 font-semibold text-white">2. Для чего используются данные</h3>
            <p>
              Данные используются для обработки заявки, связи с вами, подготовки предложения и
              дальнейшего сопровождения проекта.
            </p>
          </section>

          <section>
            <h3 className="mb-2 font-semibold text-white">3. Передача и хранение</h3>
            <p>
              Мы не продаём персональные данные. Для доставки заявки могут использоваться
              технические сервисы обработки форм и электронной почты.
            </p>
          </section>

          <section>
            <h3 className="mb-2 font-semibold text-white">4. Ваши права</h3>
            <p>
              Вы можете запросить уточнение или удаление отправленных данных, написав на{' '}
              <a className="text-cyan-300 hover:text-cyan-200" href="mailto:info@dualstack.ru">
                info@dualstack.ru
              </a>
              .
            </p>
          </section>

          <section>
            <h3 className="mb-2 font-semibold text-white">5. Согласие</h3>
            <p>
              Отправляя форму, вы подтверждаете согласие на обработку указанных данных для целей,
              описанных в этой политике.
            </p>
          </section>
        </div>
      </DialogContent>
    </Dialog>
  );
}
