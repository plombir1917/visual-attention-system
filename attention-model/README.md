## Visual Attention System – архитектура проекта

### Общая идея

- **core**: всё, что относится к «мозгам» системы — модель, пайплайн внимания, геометрия, датасет.
- **api**: сервисный слой (FastAPI / WebSocket), оборачивающий пайплайн в сетевой API.
- **clients**: клиенты, которые пользуются API (desktop, web и т.п.).
- **scripts**: скрипты/entrypoints для обучения, оценки и локального запуска.

### Структура папок

```text
├─ attention-model/
│  └─ src/
│     ├─ core/                 # Ядро ML-системы
│     │  ├─ attention_pipeline.py   # AttentionPipeline: frame -> structured result
│     │  ├─ model.py                # GazeCNN (регрессия 3D-вектора взгляда)
│     │  ├─ dataset.py              # UnityEyesDataset (gaze.h5)
│     │  ├─ geometry_attention.py   # compute_attention (геометрия, конус внимания)
│     │  └─ headpose.py             # estimate_head_pose, estimate_distance
│     │
│     ├─ api/                  # Сервисный слой
│     │  └─ attention_service.py    # FastAPI + WebSocket: /attention
│     │
│     ├─ clients/              # Клиентские приложения
│     │  └─ desktop_client.py       # Desktop-клиент: webcam -> WebSocket -> UI
│     │
│     ├─ scripts/              # Скрипты / CLI entrypoints
│     │  ├─ train.py                # Обучение GazeCNN на UnityEyes
│     │  ├─ evaluate.py             # Оценка качества модели
│     │  └─ webcam_infer.py         # Локальный запуск пайплайна с вебкамерой
│     │
│     ├─ data/                 # Данные
│     │  └─ gaze.h5 / gaze.json     # UnityEyes и вспомогательные данные
│     └─ checkpoints/          # Весы модели
│        └─ best_model.pt
```

### Диаграмма потоков (высокий уровень)

```text
Webcam frame (BGR)
      │
      ▼
core.attention_pipeline.AttentionPipeline.process_frame
      │
      ▼
structured result:
  {
    attention: bool,
    theta: float | None,
    alpha: float | None,
    distance: float | None,
    gaze_vector: np.ndarray | None
  }
```

#### Вариант 1 — локальный скрипт

```text
scripts/webcam_infer.py
    ├─ читает кадры с камеры (OpenCV)
    ├─ вызывает core.AttentionPipeline.process_frame(frame)
    └─ рисует UI (cv2.imshow, cv2.putText)
```

#### Вариант 2 — сервис + desktop-клиент

```text
clients/desktop_client.py
    ├─ webcam -> JPEG -> WebSocket (binary)
    ├─ получает JSON c результатом внимания
    └─ рисует UI + FPS

api/attention_service.py
    ├─ принимает JPEG-байты по WebSocket (/attention)
    ├─ декодирует в BGR frame
    ├─ вызывает core.AttentionPipeline.process_frame(frame)
    └─ отправляет JSON-ответ клиенту
```

### Установка зависимостей

Из директории `attention-model`:

```bash
python -m venv .venv
.venv\Scripts\activate # Windows
pip install -r requirements.txt
```

### Как запускать

Из директории `attention-model/src`:

- **Сервис внимания (WebSocket)**:

```bash
python -m uvicorn api.attention_service:app --host 0.0.0.0 --port 8765
```

- **Desktop-клиент (подключается к сервису)**:

```bash
python -m clients.desktop_client
```

- **Локальный `webcam_infer` без сети**:

```bash
python -m scripts.webcam_infer
```

- **Обучение модели**:

```bash
python -m scripts.train
```

- **Оценка модели**:

```bash
python -m scripts.evaluate
```
