// Server-rendered HTML served to search-engine crawlers (see BOT_PATTERN in
// frontend.controller.ts). This is the markup that actually gets indexed, so it
// must carry the full set of SEO meta tags + JSON-LD, mirroring public/index.html.
//
// The canonical origin is configurable via SITE_URL so non-prod environments
// (staging, preview) don't emit production canonical/OG URLs.
const DOMAIN = (process.env.SITE_URL ?? 'https://vas-focus.ru').replace(
  /\/+$/,
  '',
);

const jsonLd = JSON.stringify({
  '@context': 'https://schema.org',
  '@graph': [
    {
      '@type': 'SoftwareApplication',
      '@id': `${DOMAIN}/#app`,
      name: 'ФОКУС',
      alternateName: 'Focus Attention System',
      description:
        'Система контроля внимания в реальном времени. Анализирует взгляд и положение головы через камеру ноутбука — без дополнительного оборудования.',
      applicationCategory: 'BusinessApplication',
      applicationSubCategory: 'ProductivityApplication',
      operatingSystem: 'Web',
      url: DOMAIN,
      inLanguage: 'ru',
      offers: {
        '@type': 'Offer',
        price: '0',
        priceCurrency: 'RUB',
        availability: 'https://schema.org/InStock',
      },
      featureList: [
        'Определение направления взгляда в реальном времени',
        'Оценка позы головы через cv2.solvePnP',
        'Работа только через камеру ноутбука',
        'Приватность — видеопоток не покидает устройство',
        'Латентность менее 35 мс',
      ],
      screenshot: `${DOMAIN}/og-image.png`,
      publisher: { '@id': `${DOMAIN}/#org` },
    },
    {
      '@type': 'Organization',
      '@id': `${DOMAIN}/#org`,
      name: 'ФОКУС',
      url: DOMAIN,
      logo: {
        '@type': 'ImageObject',
        url: `${DOMAIN}/logo.png`,
        width: 1481,
        height: 640,
      },
      sameAs: ['https://github.com/plombir1917/visual-attention-system'],
    },
    {
      '@type': 'WebSite',
      '@id': `${DOMAIN}/#website`,
      url: `${DOMAIN}/`,
      name: 'ФОКУС',
      inLanguage: 'ru',
      publisher: { '@id': `${DOMAIN}/#org` },
    },
    {
      '@type': 'WebPage',
      '@id': `${DOMAIN}/#webpage`,
      url: `${DOMAIN}/`,
      name: 'ФОКУС — Контроль внимания в реальном времени',
      description:
        'ФОКУС определяет, смотришь ли ты на экран, в реальном времени. Только камера ноутбука — без браслетов и трекеров.',
      inLanguage: 'ru',
      isPartOf: { '@id': `${DOMAIN}/#website` },
      about: { '@id': `${DOMAIN}/#app` },
      primaryImageOfPage: {
        '@type': 'ImageObject',
        url: `${DOMAIN}/og-image.png`,
      },
    },
    {
      '@type': 'BreadcrumbList',
      '@id': `${DOMAIN}/#breadcrumb`,
      itemListElement: [
        {
          '@type': 'ListItem',
          position: 1,
          name: 'Главная',
          item: `${DOMAIN}/`,
        },
      ],
    },
    {
      '@type': 'FAQPage',
      '@id': `${DOMAIN}/#faq`,
      isPartOf: { '@id': `${DOMAIN}/#webpage` },
      mainEntity: [
        {
          '@type': 'Question',
          name: 'Нужно ли специальное оборудование?',
          acceptedAnswer: {
            '@type': 'Answer',
            text: 'Нет. ФОКУС работает только через встроенную камеру ноутбука — без браслетов, очков и аппаратных трекеров взгляда.',
          },
        },
        {
          '@type': 'Question',
          name: 'Покидает ли видеопоток устройство?',
          acceptedAnswer: {
            '@type': 'Answer',
            text: 'Нет. Модель обрабатывает кадры локально, видеопоток не покидает устройство — на сервер уходят только числовые метрики внимания.',
          },
        },
        {
          '@type': 'Question',
          name: 'Как быстро система определяет внимание?',
          acceptedAnswer: {
            '@type': 'Answer',
            text: 'Полный цикл «кадр → решение» занимает менее 35 мс, результат обновляется на каждом кадре при 30 кадрах в секунду.',
          },
        },
        {
          '@type': 'Question',
          name: 'Как работает оценка внимания?',
          acceptedAnswer: {
            '@type': 'Answer',
            text: 'Нейросеть на базе ResNet вычисляет 3D-вектор взгляда, cv2.solvePnP определяет позу головы, а геометрия конуса внимания (±25° плюс запас 10°) выдаёт результат ФОКУС или ОТВЛЕЧЕНИЕ.',
          },
        },
        {
          '@type': 'Question',
          name: 'Сколько стоит ФОКУС?',
          acceptedAnswer: {
            '@type': 'Answer',
            text: 'Зарегистрироваться и начать пользоваться можно бесплатно.',
          },
        },
      ],
    },
  ],
});

export function getBotHtml(): string {
  return `<!DOCTYPE html>
<html lang="ru">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0" />

<title>ФОКУС — Контроль внимания в реальном времени</title>
<meta name="description" content="ФОКУС определяет, смотришь ли ты на экран, в реальном времени: 3D-вектор взгляда, поза головы, оценка внимания за &lt;35 мс. Только камера ноутбука — без браслетов и трекеров." />
<meta name="keywords" content="контроль внимания, трекинг взгляда, eye tracking, продуктивность, фокус, нейросеть, медиапайп, mediapipe" />
<meta name="author" content="ФОКУС / Visual Attention System" />
<meta name="robots" content="index, follow, max-image-preview:large, max-snippet:-1" />
<meta name="googlebot" content="index, follow, max-image-preview:large, max-snippet:-1" />
<meta name="yandex" content="index, follow" />
<link rel="canonical" href="${DOMAIN}/" />
<link rel="alternate" hreflang="ru-RU" href="${DOMAIN}/" />
<link rel="alternate" hreflang="x-default" href="${DOMAIN}/" />

<meta property="og:type"             content="website" />
<meta property="og:locale"           content="ru_RU" />
<meta property="og:site_name"        content="ФОКУС" />
<meta property="og:title"            content="ФОКУС — Контроль внимания в реальном времени" />
<meta property="og:description"      content="Система анализирует взгляд и позу головы через камеру ноутбука. Результат за &lt;35 мс, без лишнего оборудования." />
<meta property="og:url"              content="${DOMAIN}/" />
<meta property="og:image"            content="${DOMAIN}/og-image.png" />
<meta property="og:image:secure_url" content="${DOMAIN}/og-image.png" />
<meta property="og:image:type"       content="image/png" />
<meta property="og:image:width"      content="1200" />
<meta property="og:image:height"     content="630" />
<meta property="og:image:alt"        content="ФОКУС — система контроля внимания" />

<meta name="twitter:card"        content="summary_large_image" />
<meta name="twitter:title"       content="ФОКУС — Контроль внимания в реальном времени" />
<meta name="twitter:description" content="Система анализирует взгляд и позу головы через камеру ноутбука. Результат за &lt;35 мс, без лишнего оборудования." />
<meta name="twitter:image"       content="${DOMAIN}/og-image.png" />
<meta name="twitter:image:alt"   content="ФОКУС — система контроля внимания" />

<link rel="icon" type="image/x-icon" href="/favicon.ico" />
<link rel="icon" type="image/png" sizes="32x32" href="/favicon-32x32.png" />
<link rel="icon" type="image/png" sizes="16x16" href="/favicon-16x16.png" />
<link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png" />
<link rel="manifest" href="/manifest.webmanifest" />
<meta name="theme-color" content="#2563eb" />

<script type="application/ld+json">${jsonLd}</script>
</head>
<body>
<header>
  <nav>
    <a href="/">ФОКУС</a>
    <a href="#problem">Проблема</a>
    <a href="#solution">Решение</a>
    <a href="#how">Как работает</a>
    <a href="#cta">Попробовать</a>
  </nav>
</header>

<main>
  <section id="hero">
    <h1>Секрет фокуса — контроль внимания.</h1>
    <p>Вы не знаете, сколько времени реально работаете. Теперь — знаете.</p>
  </section>

  <section id="problem">
    <h2>Ты думаешь, что работаешь.</h2>
    <p>Каждый день ты садишься за задачу — и теряешь её. Не потому что ленив. Потому что нет инструмента.</p>
    <ul>
      <li>5 мин — до первого отвлечения</li>
      <li>23 мин — чтобы снова войти в поток</li>
      <li>40% — рабочего дня уходит впустую</li>
    </ul>
  </section>

  <section id="solution">
    <h2>Мы сделали внимание измеримым.</h2>
    <p>ФОКУС анализирует взгляд и положение головы в реальном времени. Никаких браслетов — только камера ноутбука и честный ответ: ты сейчас здесь?</p>
    <article>
      <h3>Оценка взгляда</h3>
      <p>3D-вектор взгляда с точностью до 2.5°. ResNet-backbone, обученный на 80&nbsp;000+ примерах.</p>
    </article>
    <article>
      <h3>Положение головы</h3>
      <p>cv2.solvePnP определяет наклон и поворот головы в реальном времени. Учитывает движение, не только взгляд.</p>
    </article>
    <article>
      <h3>Оценка внимания</h3>
      <p>Конус внимания ±25°. Результат — ФОКУС / ОТВЛЕЧЕНИЕ + числовые метрики. Кеш в Redis, TTL 2 часа.</p>
    </article>
  </section>

  <section id="how">
    <h2>5 шагов от кадра до решения.</h2>
    <p>30 кадров/с · каждый кадр — полный цикл · результат за &lt;35 мс</p>
    <ol>
      <li><h3>Захват</h3><p>JPEG со встроенной камеры, 30 кадров/с по WebSocket.</p></li>
      <li><h3>Сетка лица</h3><p>MediaPipe: 468 ориентиров, 14 ключевых для глаз.</p></li>
      <li><h3>Нейросеть</h3><p>ResNet, кроп 55×35 пк. Выход — вектор (x, y, z) взгляда.</p></li>
      <li><h3>Поза головы</h3><p>cv2.solvePnP по 6 точкам → матрица R, углы наклона.</p></li>
      <li><h3>Решение</h3><p>Угол взгляда &lt; 25° + запас 10° → внимание = ФОКУС.</p></li>
    </ol>
    <p>Стек: Python 3.11, FastAPI, PyTorch, MediaPipe, OpenCV, WebSocket, Redis, Go, NestJS</p>
  </section>

  <section id="benefits">
    <h2>Ничего лишнего.</h2>
    <ul>
      <li><h3>Только камера</h3><p>Никакого специального оборудования. Работает прямо сейчас с любым ноутбуком.</p></li>
      <li><h3>Реальное время</h3><p>Латентность &lt; 35 мс. Показатель обновляется на каждый кадр.</p></li>
      <li><h3>Приватность</h3><p>Видеопоток не покидает устройство. Модель работает локально.</p></li>
      <li><h3>Устойчив к шуму</h3><p>EMA-сглаживание + запас 10°. Нет ложных срабатываний при моргании.</p></li>
    </ul>
    <h3>Применения</h3>
    <ul>
      <li><h4>Онлайн-обучение</h4><p>Понять, когда студент реально слушает, а когда нет.</p></li>
      <li><h4>Глубокая работа</h4><p>Объективные данные о качестве рабочих сессий.</p></li>
      <li><h4>Анализ интерфейсов</h4><p>Куда смотрят пользователи? Что привлекает внимание?</p></li>
      <li><h4>Адаптивные интерфейсы</h4><p>Система знает, что вы видите — и реагирует на это.</p></li>
    </ul>
  </section>

  <section id="faq">
    <h2>Частые вопросы</h2>
    <h3>Нужно ли специальное оборудование?</h3>
    <p>Нет. ФОКУС работает только через встроенную камеру ноутбука — без браслетов, очков и аппаратных трекеров взгляда.</p>
    <h3>Покидает ли видеопоток устройство?</h3>
    <p>Нет. Модель обрабатывает кадры локально, видеопоток не покидает устройство — на сервер уходят только числовые метрики внимания.</p>
    <h3>Как быстро система определяет внимание?</h3>
    <p>Полный цикл «кадр → решение» занимает менее 35 мс, результат обновляется на каждом кадре при 30 кадрах в секунду.</p>
    <h3>Как работает оценка внимания?</h3>
    <p>Нейросеть на базе ResNet вычисляет 3D-вектор взгляда, cv2.solvePnP определяет позу головы, а геометрия конуса внимания (±25° плюс запас 10°) выдаёт результат ФОКУС или ОТВЛЕЧЕНИЕ.</p>
    <h3>Сколько стоит ФОКУС?</h3>
    <p>Зарегистрироваться и начать пользоваться можно бесплатно.</p>
  </section>

  <section id="cta">
    <h2>Начни контролировать своё внимание.</h2>
    <p>Зарегистрируйся и уже сегодня увидишь, сколько времени ты реально работаешь.</p>
  </section>
</main>

<footer>
  <p>© 2026 ФОКУС</p>
</footer>
</body>
</html>`;
}
