# Official Stack Map

## Upstream roles

- `starter-b24ui`
  - роль: UI baseline, dependency baseline, Nuxt + `@bitrix24/b24ui-nuxt` shell
  - ссылка: `https://github.com/bitrix24/starter-b24ui`
- `B24UI docs`
  - роль: installation, component usage, visual system rules для `@bitrix24/b24ui-nuxt`
  - ссылка: `https://bitrix24.github.io/b24ui/docs/getting-started/installation/nuxt/`
- `b24jssdk docs`
  - роль: frame bootstrap, helper flow, SDK reference для `@bitrix24/b24jssdk-nuxt`
  - ссылка: `https://bitrix-tools.github.io/b24jssdk/guide/getting-started-nuxt.html`
- `initializeB24Frame reference`
  - роль: single-flight frame init contract
  - ссылка: `https://bitrix-tools.github.io/b24jssdk/reference/frame-initialize-b24-frame.html`
- `bitrix24-dev-hub`
  - роль: официальный hub по SDK, UI, starters и docs
  - ссылка: `https://github.com/bitrix-tools/bitrix24-dev-hub`

## Как использовать карту

1. UI question -> `starter-b24ui` и `B24UI docs`.
2. Frame/bootstrap question -> `b24jssdk docs`.
3. REST/signature question -> `docs/reference/bitrix24_dev_resources.md` и дальше по маршруту в official docs.
4. Starter drift review -> сначала `official-stack-map.md`, затем локальный `module-map.md`.
