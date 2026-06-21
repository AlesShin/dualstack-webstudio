# Deploy to Nichost

Требования:

- выполнен `npm install`;
- настроен SSH-доступ к хостингу.

Сборка и загрузка:

```bash
npm run deploy:nichost
```

Загрузка уже существующей папки `dist/` без новой сборки:

```bash
SKIP_BUILD=1 npm run deploy:nichost
```

Скрипт загружает статический лендинг в `/home/ale7551132/webstudio.ru/docs`.
PHP и серверная база данных для этой версии не используются.
