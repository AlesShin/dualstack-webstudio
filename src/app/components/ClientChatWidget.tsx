import { AnimatePresence, motion } from 'motion/react'
import { Copy, MessageSquareMore, Reply, Send, Trash2, X } from 'lucide-react'
import { useEffect, useRef, useState, type FormEvent } from 'react'
import { toast } from 'sonner'

import { copyTextToClipboard } from '../lib/clipboard'
import type {
  ClientProject,
  ComposePortalMessageInput,
  PortalMessage,
  PortalUser,
} from '../lib/clientPortal'

interface ClientChatWidgetProps {
  user: PortalUser
  projects: ClientProject[]
  messages: PortalMessage[]
  selectedProjectId: string | null
  isOpen: boolean
  onOpenChange: (open: boolean) => void
  onSelectProject: (projectId: string) => void
  onSendMessage: (projectId: string, input: ComposePortalMessageInput) => void
  onDeleteMessage: (messageId: string) => void
}

const quickReplies = [
  'Нужен статус по проекту',
  'Когда ближайший созвон?',
  'Сегодня отправлю материалы',
]

const actionButtonClassName =
  'inline-flex items-center gap-1 rounded-full border border-white/10 bg-white/6 px-2.5 py-1 text-[11px] text-white/62 transition-colors hover:bg-white/10 hover:text-white'

export function ClientChatWidget({
  user,
  projects,
  messages,
  selectedProjectId,
  isOpen,
  onOpenChange,
  onSelectProject,
  onSendMessage,
  onDeleteMessage,
}: ClientChatWidgetProps) {
  const [input, setInput] = useState('')
  const [replyToMessage, setReplyToMessage] = useState<PortalMessage | null>(null)
  const listRef = useRef<HTMLDivElement | null>(null)
  const inputRef = useRef<HTMLInputElement | null>(null)

  const activeProject = projects.find((project) => project.id === selectedProjectId) ?? projects[0] ?? null
  const activeMessages = activeProject
    ? messages.filter((message) => message.projectId === activeProject.id)
    : []
  const totalUnread = projects.reduce((sum, project) => sum + project.unreadCount, 0)

  useEffect(() => {
    if (!listRef.current) return
    listRef.current.scrollTop = listRef.current.scrollHeight
  }, [activeMessages, isOpen])

  useEffect(() => {
    if (!replyToMessage) return

    const replyStillExists = activeMessages.some((message) => message.id === replyToMessage.id)
    if (!replyStillExists) {
      setReplyToMessage(null)
    }
  }, [activeMessages, replyToMessage])

  function sendMessage(text: string) {
    if (!activeProject || !text.trim()) return

    onSendMessage(activeProject.id, {
      text: text.trim(),
      replyToMessage,
    })
    setInput('')
    setReplyToMessage(null)
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    sendMessage(input)
  }

  async function handleCopyMessage(message: PortalMessage) {
    try {
      await copyTextToClipboard(message.text)
      toast.success('Сообщение скопировано')
    } catch {
      toast.error('Не удалось скопировать сообщение')
    }
  }

  function handleReplyMessage(message: PortalMessage) {
    setReplyToMessage(message)
    inputRef.current?.focus()
  }

  function handleDeleteMessage(message: PortalMessage) {
    if (message.author !== 'client') return

    const confirmed = window.confirm('Удалить это сообщение из переписки?')
    if (!confirmed) return

    onDeleteMessage(message.id)
    if (replyToMessage?.id === message.id) {
      setReplyToMessage(null)
    }
    toast.success('Сообщение удалено')
  }

  if (projects.length === 0 || !activeProject) {
    return null
  }

  return (
    <div className="fixed bottom-4 right-4 z-40">
      <AnimatePresence mode="wait">
        {isOpen ? (
          <motion.div
            key="client-chat-open"
            initial={{ opacity: 0, y: 24, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 16, scale: 0.96 }}
            transition={{ duration: 0.2 }}
            className="w-[min(94vw,390px)] overflow-hidden rounded-[1.8rem] border border-white/12 bg-black/92 shadow-2xl shadow-black/60"
          >
            <div className="border-b border-white/10 bg-gradient-to-r from-blue-600/35 to-purple-600/35 px-4 py-3">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-white">Онлайн-чат по проектам</p>
                  <p className="mt-1 text-[11px] text-white/65">
                    Вы в профиле как {user.name}. Чат доступен только после входа или регистрации.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => onOpenChange(false)}
                  className="rounded-lg p-1.5 text-white/75 transition-colors hover:bg-white/10 hover:text-white"
                  aria-label="Закрыть чат"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              <div className="mt-3 flex gap-2 overflow-x-auto pb-1">
                {projects.map((project) => (
                  <button
                    key={project.id}
                    type="button"
                    onClick={() => onSelectProject(project.id)}
                    className={`shrink-0 rounded-full border px-3 py-1.5 text-xs transition-colors ${
                      project.id === activeProject.id
                        ? 'border-cyan-300/35 bg-cyan-400/12 text-cyan-100'
                        : 'border-white/10 bg-white/6 text-white/70 hover:bg-white/10 hover:text-white'
                    }`}
                  >
                    {project.name}
                  </button>
                ))}
              </div>
            </div>

            <div className="border-b border-white/10 px-4 py-3 text-sm text-white/68">
              <p className="font-medium text-white">{activeProject.name}</p>
              <p className="mt-1">
                Менеджер: {activeProject.managerName} · статус: {activeProject.status}
              </p>
            </div>

            <div ref={listRef} className="max-h-[360px] space-y-3 overflow-y-auto px-3 py-3">
              {activeMessages.map((message) => {
                const isOwnMessage = message.author === 'client'
                const canReply = message.author !== 'system'
                const canDelete = message.author === 'client'

                return (
                  <div key={message.id} className={`flex ${isOwnMessage ? 'justify-end' : 'justify-start'}`}>
                    <div className="max-w-[92%]">
                      <div
                        className={`rounded-2xl px-3 py-2 text-sm leading-relaxed ${
                          isOwnMessage
                            ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white'
                            : message.author === 'system'
                              ? 'border border-white/10 bg-white/6 text-white/70'
                              : 'border border-cyan-400/15 bg-cyan-400/10 text-white/90'
                        }`}
                      >
                        <p className="mb-1 text-[11px] uppercase tracking-[0.14em] text-white/45">
                          {message.authorName}
                        </p>
                        {message.replyToText ? (
                          <div className="mb-2 rounded-xl border border-white/10 bg-black/20 px-3 py-2 text-[12px] text-white/72">
                            <p className="font-medium text-white/78">{message.replyToAuthorName ?? 'Сообщение'}</p>
                            <p className="mt-1 break-words">{message.replyToText}</p>
                          </div>
                        ) : null}
                        <p className="break-words">{message.text}</p>
                        {message.editedAt ? (
                          <p className="mt-2 text-[11px] text-white/52">
                            Изменено администратором
                          </p>
                        ) : null}
                      </div>

                      <div className={`mt-1 flex flex-wrap gap-1 ${isOwnMessage ? 'justify-end' : 'justify-start'}`}>
                        {canReply ? (
                          <button
                            type="button"
                            onClick={() => handleReplyMessage(message)}
                            className={actionButtonClassName}
                          >
                            <Reply className="h-3 w-3" />
                            Ответить
                          </button>
                        ) : null}
                        <button
                          type="button"
                          onClick={() => handleCopyMessage(message)}
                          className={actionButtonClassName}
                        >
                          <Copy className="h-3 w-3" />
                          Копировать
                        </button>
                        {canDelete ? (
                          <button
                            type="button"
                            onClick={() => handleDeleteMessage(message)}
                            className={actionButtonClassName}
                          >
                            <Trash2 className="h-3 w-3" />
                            Удалить
                          </button>
                        ) : null}
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>

            <div className="border-t border-white/10 px-3 py-3">
              <div className="mb-2 flex flex-wrap gap-2">
                {quickReplies.map((question) => (
                  <button
                    key={question}
                    type="button"
                    onClick={() => sendMessage(question)}
                    className="rounded-full border border-white/15 px-2.5 py-1 text-xs text-white/70 transition-colors hover:border-white/30 hover:text-white"
                  >
                    {question}
                  </button>
                ))}
              </div>

              {replyToMessage ? (
                <div className="mb-2 flex items-start justify-between gap-3 rounded-2xl border border-cyan-400/18 bg-cyan-400/10 px-3 py-3">
                  <div className="min-w-0">
                    <p className="text-[11px] uppercase tracking-[0.14em] text-cyan-100/78">
                      Ответ на сообщение {replyToMessage.authorName}
                    </p>
                    <p className="mt-1 text-sm text-white/78 break-words">{replyToMessage.text}</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setReplyToMessage(null)}
                    className="rounded-full p-1 text-white/70 transition-colors hover:bg-white/10 hover:text-white"
                    aria-label="Отменить ответ"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              ) : null}

              <form onSubmit={handleSubmit} className="flex items-center gap-2">
                <input
                  ref={inputRef}
                  value={input}
                  onChange={(event) => setInput(event.target.value)}
                  placeholder="Напишите менеджеру по проекту..."
                  className="h-10 w-full rounded-xl border border-white/12 bg-white/6 px-3 text-sm text-white placeholder:text-white/35 focus:border-cyan-400/55 focus:outline-none"
                />
                <button
                  type="submit"
                  disabled={!input.trim()}
                  className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-r from-blue-600 to-purple-600 text-white disabled:opacity-50"
                  aria-label="Отправить сообщение"
                >
                  <Send className="h-4 w-4" />
                </button>
              </form>
            </div>
          </motion.div>
        ) : (
          <motion.button
            key="client-chat-closed"
            initial={{ opacity: 0, y: 12, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            onClick={() => onOpenChange(true)}
            className="group flex items-center gap-2 rounded-full border border-white/12 bg-black/88 px-3 py-2 text-white shadow-xl shadow-black/50 md:backdrop-blur-sm"
          >
            <span className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-r from-blue-600 to-purple-600">
              <MessageSquareMore className="h-5 w-5" />
            </span>
            <span className="pr-1 text-sm text-white/90">Онлайн-чат</span>
            {totalUnread > 0 ? (
              <span className="rounded-full bg-cyan-400 px-2 py-0.5 text-xs font-medium text-slate-950">
                {totalUnread}
              </span>
            ) : null}
          </motion.button>
        )}
      </AnimatePresence>
    </div>
  )
}
