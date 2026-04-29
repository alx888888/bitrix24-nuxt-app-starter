# Полная база ресурсов по разработке под Bitrix24 (Apps / Integrations / Services)

> Актуализировано: **2026-02-25**
>
> Назначение: универсальная карта источников для разработчика и ИИ-агентов по Bitrix24.
> Использование: хранить в `docs/reference/` и использовать как первичный каталог, чтобы искать решения в официальных источниках, а не "додумывать".

## 0. Что это за документ и как его использовать

### 0.1 Для кого

- `Разработчик` — быстро найти официальный раздел, примеры, стартовый шаблон и понять, что именно там лежит.
- `ИИ-агент` — получить маршрут поиска (какой источник открыть первым, где взять сигнатуру метода, где взять UI-паттерн, где взять starter).
- `Тимлид/архитектор` — стандартизировать, какими источниками команда пользуется при разработке Bitrix24-приложений и интеграций.

### 0.2 Что покрывает эта база

- REST API Bitrix24
- Локальные приложения и встройки (iframe, placements)
- Вебхуки и события
- SDK (современный `b24jssdk` + legacy `BX24.*`)
- UI/Design System (`B24UI`, `B24Icons`, UI Kit)
- Starter-проекты и примеры
- MCP и AI-friendly ресурсы
- Локальные проектные референсы (как применять в текущем проекте)

### 0.3 Принцип доверия к источникам (важно)

Использовать в таком порядке:

1. `Официальная документация` (`apidocs.bitrix24.ru`, `bitrix24.github.io`, `bitrix-tools.github.io`)
2. `Официальные репозитории` (`github.com/bitrix24`, `github.com/bitrix-tools`)
3. `Официальные статьи/анонсы` (Helpdesk, Habr от Bitrix)
4. `Вторичные источники` (статьи, форумы, чужие репозитории)

Если данные конфликтуют:

- Для сигнатур методов/параметров/ошибок приоритет у `apidocs`.
- Для актуального кода и примеров интеграции приоритет у официальных репозиториев.
- Для UX/UI-паттернов приоритет у `B24UI` docs + demo.

## 1. Визуальная карта экосистемы ресурсов (вложенная структура)

Ниже карта, по которой можно быстро понять, **куда идти в зависимости от задачи**.

```text
Bitrix24 Development Resources
|- 1) Official Docs (core)
|  |- REST API (apidocs)
|  |  |- first-steps (how REST works, auth, examples, errors)
|  |  |- api-reference (methods by product/domain)
|  |  |- events (subscriptions, event.bind/unbind)
|  |  |- placement (embed points in UI)
|  |  |- widgets / UI Kit
|  |  `- scopes / permissions
|  `- local-integrations
|     |- local apps (server/iframe apps)
|     |- local apps with AJAX
|     `- local webhooks
|- 2) SDKs & Libraries
|  |- b24jssdk (modern JS SDK for embedded apps)
|  `- BX24 legacy JS SDK (compat/migration)
|- 3) UI / Design
|  |- B24UI (Vue/Nuxt UI lib)
|  |- B24Icons
|  |- UI Kit docs in apidocs
|  `- B24UI demo/components
|- 4) Starters / Examples
|  |- starter-b24ui (Nuxt)
|  |- starter-b24ui-vue
|  `- bitrix24-dev-hub (hub of links/examples)
|- 5) Source Code & Doc Sources
|  |- GitHub org bitrix24
|  |- GitHub org bitrix-tools
|  `- b24restdocs (REST docs source)
|- 6) AI / MCP
|  |- Official Bitrix MCP (helpdesk + article)
|  `- AI-friendly docs entries (llms.txt etc.)
`- 7) Project Local References (your current repo)
   |- install/handler endpoints
   |- b24 context parsing
   |- iframe bootstrap / resize
   `- project README / docs
```

## 2. Быстрый маршрут поиска по типовой задаче (для человека и ИИ)

### 2.1 Если задача про REST-метод (найти параметры/пример/ошибки)

Маршрут:

1. `apidocs -> first-steps` (если неясна схема вызова)
2. `apidocs -> api-reference` (точный метод)
3. `apidocs -> scopes` (права)
4. `apidocs -> common-errors` (ошибки/диагностика)
5. `batch` (если нужно ускорить/сгруппировать запросы)

Что искать внутри:

- название метода (`crm.deal.list`, `user.get`, и т.п.)
- обязательные поля
- формат фильтра/пагинации
- коды ошибок
- требуемый scope

### 2.2 Если задача про iframe-приложение внутри Bitrix24

Маршрут:

1. `local-integrations -> local apps`
2. `placement.*` (где встраиваться)
3. `b24jssdk` (инициализация frame, hooks, dialog)
4. `B24UI` / `B24Icons` (UI)
5. starter (`starter-b24ui` / `starter-b24ui-vue`)

Что искать внутри:

- lifecycle приложения
- получение контекста портала/пользователя
- resize iframe
- открытие диалогов/слайдеров
- safe navigation/openPath (если legacy)

### 2.3 Если задача про события (реакция на изменения CRM и др.)

Маршрут:

1. `api-reference/events/index`
2. `event.bind / event.unbind / event.get`
3. конкретный доменный раздел (`crm`, `tasks`, `calendar` и т.п.)
4. `common-errors` + retry strategy

Что искать внутри:

- имя события
- формат payload
- ограничения и особенности доставки
- как отписаться/переустановить подписку

### 2.4 Если задача про UI в стиле Bitrix24

Маршрут:

1. `B24UI docs -> getting started`
2. `B24UI docs -> installation (Nuxt/Vue)`
3. `B24UI demo/components`
4. `B24Icons`
5. `apidocs widgets/ui-kit` (если нужен платформенный UX-контекст)

Что искать внутри:

- готовый компонент
- props/slots/events
- паттерн layout/form/table/dialog
- иконки и визуальная консистентность

### 2.5 Если задача про быстрый прототип/старт проекта

Маршрут:

1. `starter-b24ui` или `starter-b24ui-vue`
2. `bitrix24-dev-hub`
3. `b24jssdk getting started`
4. текущий проект (как рабочий референс)

Что искать внутри:

- структура проекта
- dev scripts
- конфигурация Nuxt/Vue
- типовой flow установки/запуска приложения

## 3. Официальная документация Bitrix24 (ядро)

### 3.1 Главная точка входа в REST API

Что это:

- Основной официальный справочник по REST API Bitrix24.
- Базовый источник истины для методов, параметров, ошибок и структуры API.

Где применять:

- Любые интеграции (server-to-server)
- Локальные и публичные приложения
- Разработка backend-сервисов, которые работают с Bitrix24

Содержимое (что там есть):

- обзор разработки через REST
- пошаговые инструкции (first steps)
- справочник методов по разделам (`api-reference`)
- события (`events`)
- scopes/permissions
- виджеты/UI Kit/встройка

Ресурсы:

- [Главная документация REST API](https://apidocs.bitrix24.ru/)
- [Разработка с REST API (обзорный вход)](https://apidocs.bitrix24.ru/developing-with-rest-api.html)
- [Справочник API (index)](https://apidocs.bitrix24.ru/api-reference/index.html)
- [First Steps (основные шаги)](https://apidocs.bitrix24.ru/first-steps/index.html)

### 3.2 First Steps (обязательно изучать перед реализацией)

Что это:

- Раздел "первые шаги", который объясняет механику REST, авторизации, примеров и типовых ошибок.

Зачем нужен:

- Уменьшает количество неправильных запросов и неверных предположений.
- Помогает быстро собрать корректный базовый flow (auth + вызовы + обработка ошибок).

Содержимое (типично):

- как работает REST API в Bitrix24
- как вызывать методы
- как использовать примеры в документации
- разработка на своем сервере
- разделы по авторизации/OAuth
- типичные ошибки

Когда открывать:

- До начала новой интеграции
- При проблемах с auth/вызовами/ошибками
- Когда агент предлагает код без ссылок на официальную механику

Ресурсы:

- [Как работает REST API](https://apidocs.bitrix24.ru/first-steps/how-rest-works.html)
- [Как вызывать REST API](https://apidocs.bitrix24.ru/first-steps/how-to-call-rest-api/how-to-call-rest-api.html)
- [Как использовать примеры в документации](https://apidocs.bitrix24.ru/first-steps/how-to-use-examples.html)
- [Разработка на своем сервере](https://apidocs.bitrix24.ru/first-steps/development-on-your-own-server.html)
- [Типичные ошибки](https://apidocs.bitrix24.ru/first-steps/how-to-call-rest-api/common-errors.html)

### 3.3 Авторизация, OAuth, токены, scopes

Что это:

- Набор материалов о доступе к API: OAuth 2.0, scopes, получение/обновление токенов, auth-данные в iframe.

Где применять:

- Публичные приложения
- Локальные приложения с backend
- Многопортальные (multi-tenant) сервисы
- Миграция между схемами auth

Содержимое (что искать):

- полный OAuth flow
- продление токенов
- упрощенные схемы получения токенов
- список доступных scopes
- JS helper-функции (`BX24.getAuth`, `BX24.refreshAuth`) для legacy-случаев

Ресурсы:

- [First Steps / входная точка по авторизации](https://apidocs.bitrix24.ru/first-steps/index.html)
- [Scopes / permissions](https://apidocs.bitrix24.ru/api-reference/scopes/permissions.html)
- [Legacy JS SDK index (для `BX24.getAuth`, `BX24.refreshAuth` и др.)](https://apidocs.bitrix24.ru/sdk/bx24-js-sdk/index.html)
- [BX24.getAuth](https://apidocs.bitrix24.ru/sdk/bx24-js-sdk/additional-functions/bx24-get-auth.html)

Практический совет:

- Для production-интеграций не полагаться на догадки ИИ по refresh-flow; всегда сверять с `first-steps` и официальными примерами.

### 3.4 Вебхуки (быстрые интеграции)

Что это:

- Механизм быстрого доступа к REST API без полного OAuth-приложения (зависит от сценария и прав).

Где применять:

- Прототипы
- Внутренние автоматизации
- Серверные интеграции с ограниченным набором методов
- Cron/ETL/сервисные задачи

Содержимое (что искать):

- регистрация вебхука
- типы вебхуков
- ограничения по правам
- формат вызова через URL

Ресурсы:

- [Как зарегистрировать вебхук](https://apidocs.bitrix24.ru/first-steps/how-to-call-rest-api/how-to-register-webhook.html)
- [Локальные вебхуки (раздел)](https://apidocs.bitrix24.ru/local-integrations/local-webhooks.html)

Подводные камни:

- Не все сценарии удобно или корректно закрываются вебхуками.
- Для сложных app-flow и UI-встраивания нужен путь через приложение (local/public app), а не только webhook.

### 3.5 Локальные приложения (встраиваемые app-сценарии)

Что это:

- Разделы по локальным приложениям в Bitrix24 (в том числе iframe-сценарии и взаимодействие с порталом).

Где применять:

- CRM tabs / placements
- Встраиваемые интерфейсы
- Приложения с собственной серверной логикой

Содержимое (что искать):

- модель локального приложения
- install/handler flow
- обмен данными с порталом
- AJAX-взаимодействие
- особенности исполнения внутри Bitrix24

Ресурсы:

- [Локальные приложения (раздел)](https://apidocs.bitrix24.ru/local-integrations/local-apps.html)
- [Локальные приложения с AJAX](https://apidocs.bitrix24.ru/local-integrations/local-apps-with-ajax.html)

### 3.6 События (events) и подписки

Что это:

- Механизм подписки на события Bitrix24 и каталог доступных событий.

Где применять:

- Интеграции, которые должны реагировать на изменения в CRM/задачах/календаре и др.
- Event-driven синхронизация данных

Содержимое (что искать):

- список событий по доменам
- методы регистрации/получения подписок
- формат payload
- требования к обработчику события

Ресурсы:

- [Список событий (index)](https://apidocs.bitrix24.ru/api-reference/events/index.html)
- [event.bind](https://apidocs.bitrix24.ru/api-reference/events/event-bind.html)
- [event.unbind](https://apidocs.bitrix24.ru/api-reference/events/event-unbind.html)
- [event.get](https://apidocs.bitrix24.ru/api-reference/events/event-get.html)

Практический совет:

- После установки приложения документировать, какие события вы подписываете, где их обработчик и как выполняется повторная регистрация.

### 3.7 Batch, лимиты, ошибки, эксплуатация

Что это:

- Разделы для оптимизации и надежной эксплуатации интеграций.

Где применять:

- Production-сервисы
- Высокочастотные интеграции
- Массовые операции и синхронизация

Содержимое (что искать):

- пакетный вызов `batch`
- common errors
- стратегии повторных запросов (реализуете сами, но ориентируетесь на коды/ответы docs)
- диагностика неправильных параметров/scopes/auth

Ресурсы:

- [Пакетный вызов `batch`](https://apidocs.bitrix24.ru/api-reference/batch.html)
- [Типичные ошибки](https://apidocs.bitrix24.ru/first-steps/how-to-call-rest-api/common-errors.html)

## 4. Встройка в интерфейс Bitrix24 (Placements / Widgets / UI Kit)

### 4.1 Placements (точки встраивания)

Что это:

- API и каталог точек встраивания приложения в интерфейс Bitrix24.

Где применять:

- Вкладки CRM сущностей
- Кнопки/панели/области интерфейса, где нужно открыть ваше приложение

Содержимое (что искать):

- список доступных placements
- регистрация placement (`bind`)
- удаление (`unbind`)
- получение списка и параметров (`list/get`)
- payload/контекст placement при открытии

Ресурсы:

- [Placements (index)](https://apidocs.bitrix24.ru/api-reference/placement/index.html)
- [placement.bind](https://apidocs.bitrix24.ru/api-reference/placement/placement-bind.html)
- [placement.unbind](https://apidocs.bitrix24.ru/api-reference/placement/placement-unbind.html)
- [placement.list](https://apidocs.bitrix24.ru/api-reference/placement/placement-list.html)
- [placement.get](https://apidocs.bitrix24.ru/api-reference/placement/placement-get.html)

Практический совет:

- Хранить список используемых placement-кодов в проектной документации (и сверять с кодом install-обработчика).

### 4.2 Widgets и UI Kit в `apidocs`

Что это:

- Официальные материалы по виджетам и UI Kit внутри документации Bitrix24.

Где применять:

- Когда нужна нативная UX-логика и понимание платформенных паттернов интерфейса
- При проектировании интерфейса встроенного приложения

Содержимое (что искать):

- обзор UI Kit
- дизайн-принципы
- категории компонентов и шаблонов
- платформенные поведенческие паттерны

Ресурсы:

- [Widgets / UI Kit (index)](https://apidocs.bitrix24.ru/api-reference/widgets/ui-kit/index.html)
- [UI Kit: дизайн-принципы](https://apidocs.bitrix24.ru/api-reference/widgets/ui-kit/design.html)
- [UI Kit: компоненты и шаблоны](https://apidocs.bitrix24.ru/api-reference/widgets/ui-kit/components.html)

## 5. SDK и библиотеки для приложений Bitrix24

### 5.1 `b24jssdk` (современный JS SDK, рекомендуемый путь)

Что это:

- Современный JavaScript SDK для разработки приложений Bitrix24, особенно встроенных (iframe/frame) приложений.

Где применять:

- Nuxt/Vue/JS приложения внутри Bitrix24
- Инициализация контекста приложения
- Работа с frame API, dialog, hooks
- Удобная интеграция frontend с Bitrix24-контекстом

Содержимое (что там есть):

- `Guide` (старт, интеграция с фреймворками)
- `Reference / Frame` (работа с frame и жизненным циклом)
- `Reference / Hooks` (готовые hooks/composables-подобные интерфейсы)
- вспомогательные API для встроенного приложения
- примеры использования в Nuxt

Ресурсы:

- [Документация `b24jssdk` (главная)](https://bitrix-tools.github.io/b24jssdk/)
- [Getting Started (Nuxt)](https://bitrix-tools.github.io/b24jssdk/guide/getting-started-nuxt.html)
- [Reference: Frame API](https://bitrix-tools.github.io/b24jssdk/reference/frame-index.html)
- [Reference: `initializeB24Frame`](https://bitrix-tools.github.io/b24jssdk/reference/frame-initialize-b24-frame.html)
- [Reference: Frame Dialog](https://bitrix-tools.github.io/b24jssdk/reference/frame-dialog.html)
- [Reference: Hooks](https://bitrix-tools.github.io/b24jssdk/reference/hook-index.html)
- [GitHub repo `bitrix24/b24jssdk`](https://github.com/bitrix24/b24jssdk)

Когда открывать первым:

- Любая задача формата "встроенное приложение в Bitrix24 на Vue/Nuxt/JS"
- Нужно корректно инициализировать frame без self-made хака
- Нужно уменьшить зависимость от legacy `BX24.*`

### 5.2 Legacy SDK (`BX24.*`) — для совместимости и миграций

Что это:

- Исторический JS SDK / API-функции `BX24.*`, которые часто встречаются в старых примерах и существующих приложениях.

Где применять:

- Поддержка старого кода
- Миграция на `b24jssdk`
- Точечные legacy helper-функции (`getAuth`, `openPath` и т.п.)

Содержимое (что искать):

- базовые функции инициализации
- auth helper-функции
- функции открытия страниц/слайдеров
- дополнительные utility-функции

Ресурсы:

- [JS library introduction (1C-Bitrix docs)](https://dev.1c-bitrix.ru/api_help/js_lib/introduction.php)
- [BX24 JS SDK (legacy section в apidocs)](https://apidocs.bitrix24.ru/sdk/bx24-js-sdk/index.html)
- [BX24.getAuth](https://apidocs.bitrix24.ru/sdk/bx24-js-sdk/additional-functions/bx24-get-auth.html)
- [BX24.openPath](https://apidocs.bitrix24.ru/sdk/bx24-js-sdk/additional-functions/bx24-open-path.html)

Совет по использованию:

- Если начинаете новый проект, сначала пробуйте решить задачу через `b24jssdk`; `BX24.*` использовать как fallback или для миграции.

## 6. UI / Design System / Компоненты (современный стек под Bitrix24)

### 6.1 `B24UI` (основная UI-библиотека для Vue/Nuxt)

Что это:

- Официальная UI-библиотека Bitrix24 для Vue/Nuxt (на базе Nuxt UI) с набором стилизованных и доступных компонентов.

Где применять:

- Любые новые интерфейсы приложений Bitrix24 на Vue/Nuxt
- Формы, таблицы, навигация, модалки, карточки
- Быстрая сборка UI в стиле Bitrix24

Содержимое (что там есть):

- `Getting Started` (вход в библиотеку)
- `Installation` (Nuxt / Vue)
- `Demo` (живые примеры компонентов)
- `Migration` (например, v2)
- `AI / llms.txt` (точка входа для ИИ-агентов)
- документация компонентов (props/slots/events/стили)

Ресурсы:

- [B24UI docs (главная)](https://bitrix24.github.io/b24ui/)
- [B24UI docs: Getting Started](https://bitrix24.github.io/b24ui/docs/getting-started/)
- [B24UI docs: Installation (Nuxt)](https://bitrix24.github.io/b24ui/docs/getting-started/installation/nuxt/)
- [B24UI docs: Migration v2](https://bitrix24.github.io/b24ui/docs/getting-started/migration/v2/)
- [B24UI demo (пример компонента)](https://bitrix24.github.io/b24ui/demo/components/accordion/)
- [B24UI docs: AI / LLM entry](https://bitrix24.github.io/b24ui/docs/getting-started/ai/llms-txt/)
- [GitHub repo `bitrix24/b24ui`](https://github.com/bitrix24/b24ui)

Когда открывать:

- Нужен современный UI и не хочется собирать дизайн вручную
- Нужно сделать интерфейс визуально совместимым с Bitrix24
- ИИ-агенту нужно быстро получить документацию компонентов в машиночитаемой форме

### 6.2 `B24Icons` (официальные иконки)

Что это:

- Набор иконок Bitrix24 для web-приложений.

Где применять:

- Кнопки, меню, статусы, навигация, индикаторы
- Любой UI, где важна визуальная консистентность с Bitrix24

Содержимое (что искать):

- каталог иконок
- способы использования в проектах
- названия/ключи иконок

Ресурсы:

- [B24Icons docs / gallery](https://bitrix24.github.io/b24icons/)
- [GitHub repo `bitrix24/b24icons`](https://github.com/bitrix24/b24icons)

### 6.3 UI Kit внутри `apidocs` vs `B24UI` (что выбирать)

Правило выбора:

- `B24UI` -> если вы пишете приложение на Vue/Nuxt и хотите готовые компоненты.
- `UI Kit в apidocs` -> если вам важнее понять платформенные UX-принципы/категории/паттерны и платформенный контекст.
- Использовать вместе -> лучший вариант для новых встраиваемых приложений.

## 7. Стартеры, шаблоны и примеры приложений

### 7.1 Официальные starter-проекты

Что это:

- Готовые стартовые шаблоны, которые ускоряют запуск нового проекта и задают базовую структуру.

Где применять:

- Новый проект с нуля
- Прототип
- Эталон структуры для команды
- Референс по конфигурации и зависимостям

Содержимое (что там обычно есть):

- базовая структура проекта
- настройки сборки/запуска
- подключение UI-библиотеки
- демонстрационные страницы/компоненты
- шаблон для дальнейшей интеграции с Bitrix24 API/SDK

Ресурсы:

- [Starter `starter-b24ui` (Nuxt)](https://github.com/bitrix24/starter-b24ui)
- [Live demo `starter-b24ui`](https://bitrix24.github.io/starter-b24ui/)
- [Starter `starter-b24ui-vue` (Vue)](https://github.com/bitrix24/starter-b24ui-vue)

Как выбирать:

- `Nuxt` проект -> `starter-b24ui`
- `Vue` без Nuxt -> `starter-b24ui-vue`

### 7.2 `bitrix24-dev-hub` (агрегатор ссылок и референсов)

Что это:

- Репозиторий-агрегатор от `bitrix-tools`, который помогает быстро найти нужные материалы по экосистеме.

Где применять:

- На старте исследования
- Когда нужно быстро собрать набор ссылок/примеров
- Как навигационный слой поверх официальных docs и SDK

Содержимое (типично):

- ссылки на официальные docs
- ссылки на SDK/библиотеки
- примеры, стартеры, инструменты
- сопутствующие ресурсы по разработке под Bitrix24

Ресурсы:

- [Bitrix24 Dev Hub (repo)](https://github.com/bitrix-tools/bitrix24-dev-hub)

## 8. Исходники документации и официальные GitHub-организации

### 8.1 GitHub-организации (`bitrix24`, `bitrix-tools`)

Что это:

- Главные точки входа в официальные репозитории экосистемы Bitrix24.

Где применять:

- Поиск SDK, UI-библиотек, starter-проектов
- Проверка issues/changelog/releases
- Поиск примеров и исходного кода

Содержимое (что искать):

- актуальные репозитории
- archived/legacy репозитории (для миграции)
- исходники документации и библиотек
- примеры конфигурации/запуска

Ресурсы:

- [GitHub org `bitrix24`](https://github.com/bitrix24)
- [GitHub org `bitrix-tools`](https://github.com/bitrix-tools)

### 8.2 `b24restdocs` (исходники REST-документации)

Что это:

- Репозиторий с исходниками/структурой документации REST API.

Где применять:

- Когда нужно понять структуру документации
- Когда ищете страницу по названию/пути быстрее через репозиторий
- Когда хотите отслеживать изменения/PR в docs

Содержимое (что искать):

- markdown/исходные файлы документации
- структуру разделов `first-steps`, `api-reference`, и др.
- историю изменений документации

Ресурсы:

- [GitHub repo `bitrix24/b24restdocs`](https://github.com/bitrix24/b24restdocs)

## 9. MCP и AI-ресурсы (для ИИ-агентов и AI-assisted разработки)

### 9.1 Официальный MCP Bitrix24

Что это:

- Официальный подход/инструмент для подключения ИИ к документации и контексту Bitrix24 через MCP.

Где применять:

- AI-агенты для разработки под Bitrix24
- Автоматический поиск методов и статей
- Снижение риска галлюцинаций при генерации кода

Содержимое (что искать):

- как подключить MCP
- какие данные/документы доступны агенту
- примеры использования в AI-сценариях

Ресурсы:

- [Helpdesk: MCP server в Bitrix24](https://helpdesk.bitrix24.ru/open/28193648/)
- [Habr (Bitrix): MCP для Bitrix24](https://habr.com/ru/companies/bitrix/articles/916852/)

### 9.2 AI-friendly docs entries (`llms.txt`, подготовленные выгрузки)

Что это:

- Специальные точки входа или выгрузки документации, более удобные для LLM/агентов.

Где применять:

- Если агенту нужно быстро получить контент docs в текстовой форме
- Если хотите сократить время навигации по сайту/демо

Содержимое (что искать):

- `llms.txt` / AI docs page
- агрегированные текстовые версии docs
- краткие AI-инструкции по использованию документации

Ресурсы:

- [B24UI docs: AI / LLM entry](https://bitrix24.github.io/b24ui/docs/getting-started/ai/llms-txt/)
- Локальный файл проекта: `docs/reference/b24ui-llms-full.txt`

## 10. Вторичные, но полезные источники (использовать после official docs)

### 10.1 Habr (официальный блог Bitrix)

Что это:

- Публикации Bitrix с анонсами, объяснениями и обзорами инструментов.

Где применять:

- Понять контекст нового инструмента (например, MCP)
- Найти обзорный материал перед чтением глубокой документации

Содержимое (что искать):

- анонсы SDK/UI/MCP
- практические статьи
- обзорные материалы по новым возможностям

Ресурсы:

- [Habr: компания Bitrix](https://habr.com/ru/companies/bitrix/)

Правило:

- Для точных API-сигнатур и поведения методов всегда перепроверять по `apidocs`.

## 11. Локальные ресурсы текущего проекта (как рабочие референсы)

Этот раздел делает базу пригодной не только как "справочник по интернету", но и как **оперативную карту конкретного проекта**.

### 11.1 Что это дает

- Можно быстро найти рабочую реализацию install/handler flow
- Можно сверить, как проект обрабатывает контекст портала
- Можно показать ИИ-агенту конкретные файлы, а не просить его писать с нуля

### 11.2 Документация проекта

- `README.md`
  Что там есть:
  - архитектура приложения
  - flow установки (`/api/b24/install`) и обработчика (`/api/b24/handler`)
  - scope'ы, endpoints, runtime-модель
  - настройки и эксплуатационные детали

- `docs/architecture/invariants.md`
  Что там есть:
  - локальные правила по platform shell
  - status policy
  - bootstrap path для B24 frame

- `docs/architecture/api-contracts.md`
  Что там есть:
  - wire contract для `/api/platform/status`
  - install/handler endpoints
  - общая структура payload для старта разработки

### 11.3 Backend / Bitrix24 integration endpoints

- `server/api/b24/install.ts`
  Что смотреть:
  - регистрацию placements (`placement.bind`)
  - обработку `ONAPPINSTALL`
  - ветки install/uninstall
  - redirect и JSON response policy

- `server/api/b24/handler.ts`
  Что смотреть:
  - вход в приложение из Bitrix24
  - редирект/передача безопасного контекста
  - best-effort touch `lastAppOpenedAt`

- `server/api/platform/status.get.ts`
  Что смотреть:
  - aggregated status adapter
  - чтение B24 context из headers/query

- `server/api/app-events/opened.post.ts`
  Что смотреть:
  - best-effort open event
  - обновление profile telemetry

### 11.4 Общая серверная логика (переиспользуемый референс)

- `shared/server-core/platform/context.ts`
  Что смотреть:
  - парсинг и валидация B24-контекста
  - sanitize install payload

- `shared/server-core/platform/profile.ts`
  Что смотреть:
  - разрешение/идентификация профиля портала
  - install/open lifecycle

- `shared/server-core/platform/rest.ts`
  Что смотреть:
  - Bitrix REST wrappers
  - `app.info`, `placement.bind`, `placement.unbind`

- `shared/server-core/platform/status.ts`
  Что смотреть:
  - агрегированный status payload
  - деградация без DB или REST контекста

### 11.5 Frontend / iframe integration (Nuxt)

- `app/composables/use-platform-bootstrap.ts`
  Что смотреть:
  - bootstrap приложения
  - open event
  - единый client flow для B24 context

- `app/features/platform-frame/runtime.ts`
  Что смотреть:
  - query context
  - Nuxt SDK bootstrap
  - legacy `BX24` fallback

- `app/stores/b24-context.ts`
  Что смотреть:
  - хранение и использование контекста портала/пользователя на клиенте
  - typed request headers для `/api/platform/status` и `/api/app-events/opened`

## 12. Что было добавлено сверх исходного списка (ключевые пробелы)

Ниже — то, чего обычно не хватает в ручных подборках, но без чего интеграции часто ломаются или делаются неверно:

- `first-steps` (механика REST, примеры, ошибки, server-side разработка)
- `local-integrations` (локальные приложения, AJAX, локальные вебхуки)
- `events` и методы подписки (`event.bind/unbind/get`)
- `placement` index и методы (`placement.bind/...`)
- `scopes/permissions`
- `batch`
- `common-errors`
- `BX24` legacy SDK раздел в `apidocs` (для миграций/совместимости)
- `b24restdocs` (исходники docs)
- GitHub-организации `bitrix24` и `bitrix-tools`
- раздел про `MCP` и AI-friendly точки входа

## 13. Как адаптировать этот файл для любого нового проекта (шаблон использования)

### 13.1 Что оставить общим (не менять)

Оставлять как есть:

- разделы `1-10` (глобальные ресурсы Bitrix24)
- маршруты поиска по типовым задачам
- правила приоритета источников
- AI/MCP раздел

### 13.2 Что менять в каждом новом проекте

Обновлять под проект:

- раздел `11. Локальные ресурсы текущего проекта`
- список локальных endpoint'ов (`install`, `handler`, события)
- список composables/stores/services
- project-specific docs (`README`, `docs/*`)

### 13.3 Мини-шаблон локального раздела для копирования

```text
11. Локальные ресурсы проекта
- README.md (архитектура/flow)
- docs/* (решения, ограничения, инварианты)
- api/b24/install.* (установка, регистрация placement'ов)
- api/b24/handler.* (вход в приложение)
- server-core/* (контекст, auth, portal profile)
- app/composables/* (bootstrap, resize, b24 sdk integration)
- app/stores/* (контекст и состояние)
```

## 14. Чеклист для ИИ-агента (анти-галлюцинации)

Использовать перед тем, как предлагать код:

1. Найден ли **официальный источник** для этой задачи?
2. Указана ли **конкретная страница** docs/repo, а не только общая ссылка?
3. Проверены ли **scope/permissions**?
4. Проверен ли **тип интеграции** (webhook vs local app vs public app)?
5. Если задача про UI/iframe — проверены ли `b24jssdk` и `B24UI`?
6. Если задача про события — проверены ли `events` + `event.bind/unbind`?
7. Если есть пример в текущем проекте — использован ли он как референс?

## 15. Готовый шаблон запроса к ИИ-агенту (рекомендуется)

```text
Используй файл /BITRIX24_DEV_RESOURCES.md как карту источников.

Правила:
1) Сначала найди официальный источник (apidocs / bitrix24.github.io / bitrix-tools.github.io / github.com/bitrix24).
2) Дай ссылки на конкретные страницы, которые подтверждают решение.
3) Только после этого предлагай код.
4) Если задача про iframe/UI — обязательно проверь b24jssdk и B24UI.
5) Если задача про REST/auth/events/placement — обязательно проверь first-steps + api-reference + scopes.
6) Если в проекте уже есть похожая реализация — сначала найди и переиспользуй её.
```

## 16. Рекомендации по обновлению базы (поддержка актуальности)

Обновлять при запуске нового проекта или при изменениях в экосистеме:

1. Проверить `bitrix24/b24jssdk`, `bitrix24/b24ui`, `bitrix24/b24icons` (новые версии/разделы docs).
2. Проверить `apidocs.bitrix24.ru`:
   - `first-steps`
   - `local-integrations`
   - `api-reference/events`
   - `api-reference/placement`
   - `widgets/ui-kit`
   - `scopes`
3. Проверить `bitrix-tools/bitrix24-dev-hub` (новые ссылки/инструменты/стартеры).
4. Проверить MCP/AI-материалы (Helpdesk/Habr Bitrix).
5. Обновить локальный раздел проекта (`README`, `docs`, `api/*`, `server-core/*`, `app/*`).
