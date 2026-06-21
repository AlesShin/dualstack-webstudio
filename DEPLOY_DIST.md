# Deploy Through `dist`

Соберите готовую версию:

```bash
npm run dist:ready
```

В `dist/` будут статические файлы лендинга:

- `index.html`
- `assets/*`
- `.htaccess`
- `favicon.svg`
- `robots.txt`
- `sitemap.xml`

Загрузите содержимое `dist/` в корневую папку сайта на хостинге.

Собственная база данных и PHP для работы лендинга не требуются. Контактная форма отправляется через внешний сервис FormSubmit.

Для создания архива:

```bash
npm run dist:zip
```
