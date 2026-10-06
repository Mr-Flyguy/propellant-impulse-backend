# Propellant Impulse Backend — Веб-сервис базы данных ракетных топлив

Бэкенд-сервис для платформы расчета удельного импульса и каталогизации рабочих тел ядерных ракетных двигателей (ЯРД) и ЖРД.

---

## 1. Стек технологий и инфраструктура

- **Backend Framework**: NestJS (Node.js / TypeScript)
- **База данных**: PostgreSQL 16 (порт `5433`)
- **ORM**: TypeORM
- **Объектное хранилище медиа**: Minio S3 (API порт `9000`, Web-консоль порт `9001`)
- **СУБД Web-интерфейс**: Adminer (порт `8080`)
- **Валидация**: `class-validator`, `class-transformer`

---

## 2. Быстрый запуск

### 2.1. Запуск инфраструктуры (Docker Compose)

```bash
docker compose up -d
```

Контейнеры:
- `propellant_postgres` — PostgreSQL (`localhost:5433`, user: `propellant_user`, db: `propellant_db`)
- `propellant_minio` — S3 Minio (`localhost:9000` / Console `localhost:9001`, user: `propellant_admin`, pass: `propellant_secret_pass`)
- `propellant_adminer` — Adminer (`localhost:8080`)

### 2.2. Запуск бэкенда

```bash
npm install
npm run build
npm run start
```

Сервер запускается по адресу: `http://localhost:3000`.

Для тестирования API подготовлена коллекция запросов для Insomnia / Postman.

---

## 3. Архитектура и структура базы данных

### 3.1. Таблица `users` (Пользователи системы)

| Поле | Тип данных | Ограничения | Описание |
| :--- | :--- | :--- | :--- |
| `id` | `SERIAL` | `PRIMARY KEY` | Уникальный идентификатор инженера/пользователя |
| `username` | `VARCHAR(64)` | `NOT NULL, UNIQUE` | Логин пользователя |
| `email` | `VARCHAR(128)` | `NOT NULL, UNIQUE` | Электронная почта |
| `password` | `VARCHAR(255)` | `NOT NULL` | Пароль пользователя (хэш) |
| `created_at` | `TIMESTAMPTZ` | `DEFAULT CURRENT_TIMESTAMP` | Дата и время регистрации |

### 3.2. Таблица `propellants` (Ракетные топлива / Услуги)

| Поле | Тип данных | Ограничения | Описание |
| :--- | :--- | :--- | :--- |
| `id` | `SERIAL` | `PRIMARY KEY` | Уникальный идентификатор записи |
| `name` | `VARCHAR(100)` | `NOT NULL` | Наименование ракетного топлива / рабочего тела |
| `short_description` | `TEXT` | `NOT NULL` | Краткое описание физико-химических свойств |
| `status` | `VARCHAR(20)` | `NOT NULL, CHECK (status IN ('draft', 'published', 'deleted'))` | Жизненный цикл записи |
| `image_url` | `VARCHAR(255)` | `NOT NULL` | URL схемы/фото в объектном хранилище Minio |
| `video_url` | `VARCHAR(255)` | `NOT NULL` | URL видеозаписи истечения факела в Minio |
| `molar_mass` | `NUMERIC(6,3)` | `NOT NULL` | Молярная масса рабочего тела $\mu$ (г/моль) |
| `specific_heat_ratio` | `NUMERIC(4,3)` | `NOT NULL` | Показатель адиабаты $k$ |
| `creator_id` | `INT` | `NOT NULL, FOREIGN KEY -> users(id) ON DELETE RESTRICT` | Автор записи (назначается сервером) |

### 3.3. Таблица `propellant_likes` (Связь «Многие-ко-многим»: Лайки)

| Поле | Тип данных | Ограничения | Описание |
| :--- | :--- | :--- | :--- |
| `user_id` | `INT` | `PRIMARY KEY, FOREIGN KEY -> users(id)` | Пользователь, поставивший отметку |
| `propellant_id` | `INT` | `PRIMARY KEY, FOREIGN KEY -> propellants(id)` | Оцениваемое рабочее тело |
| `created_at` | `TIMESTAMPTZ` | `DEFAULT CURRENT_TIMESTAMP` | Время выставления отметки |

---

## 4. Бизнес-правила и особенности реализации

1. **Концепция постоянного пользователя (Singleton)**:
   - Авторизация с полноценными сессиями будет реализована в следующей версии. В текущей версии текущий пользователь фиксирован на бэкенде.
   - Реализована функция-синглтон `getCurrentUser()` и синглтон-сервис `CurrentUserService`:
     ```ts
     { id: 1, username: 'user_1', email: 'user1@example.com' }
     ```
   - Клиент **не может** передавать `creator_id`, `id` или `status` при создании услуги. Все системные поля назначаются сервером.
2. **Жизненный цикл статусов (`draft` $\to$ `published` $\to$ `deleted`)**:
   - Новая запись создается только в статусе `draft`.
   - Опубликовать (`published`) можно **только** черновик (`draft`). Перевод обратно в черновик невозможен.
   - Опубликовать и удалить запись может **только её создатель** (`creator_id === currentUser.id`).
   - Удаление является **мягким (soft delete)**: статус переводится в `deleted`. Физически запись сохраняется в БД, но исключается из всех списков, ленты и каталога для клиентов.
3. **Хранилище Minio**:
   - Изображения и видео загружаются в бакет `propellants` на Minio через `multipart/form-data`.
   - Имена файлов генерируются на латинице с временными метками: `${prefix}_${Date.now()}_${random}.${ext}` (например, `propellant_1791316484797_ublwk7.jpg`).
4. **Вычисляемые поля в ответах API**:
   - `is_creator`: `1` если запись создана текущим пользователем, `0` иначе.
   - `is_liked`: `1` если текущий пользователь лайкнул запись, `0` иначе.
   - `likes_count`: общее количество лайков.

---

## 5. Документация REST API эндпоинтов

Базовый путь всех API-методов: `/api/*`.

### 5.1. `GET /api/propellants` — Список услуг с фильтром (Каталог)

- **Назначение**: Получение каталога опубликованных и черновых услуг текущего пользователя с поддержкой фильтрации. Записи в статусе `deleted` исключены.
- **Параметры Query**:
  - `max_molar_mass` *(number, optional)*: Максимальная молярная масса рабочего тела (фильтр $\le$).
- **Код ответа**: `200 OK`
- **Пример ответа**:
```json
[
  {
    "id": 1,
    "name": "Жидкий водород",
    "short_description": "Эффективное рабочее тело с наименьшей молярной массой для предельного удельного импульса.",
    "status": "published",
    "image_url": "http://localhost:9000/propellants/propellant_h2.jpg",
    "video_url": "http://localhost:9000/propellants/video_exhaust_h2.mp4",
    "molar_mass": 2.016,
    "specific_heat_ratio": 1.41,
    "creator_id": 1,
    "likes_count": 3,
    "is_creator": 1,
    "is_liked": 1
  }
]
```

---

### 5.2. `POST /api/propellants` — Создание услуги с файлами (Черновик)

- **Назначение**: Создание новой услуги (черновика) с одновременной загрузкой картинки и видео в Minio. Системные поля `creator_id`, `status='draft'` заполняются сервером.
- **Формат запроса**: `multipart/form-data`
- **Поля формы**:
  - `name` *(string, required)*: Наименование рабочего тела.
  - `short_description` *(string, required)*: Краткое описание.
  - `molar_mass` *(number, required)*: Молярная масса.
  - `specific_heat_ratio` *(number, required)*: Показатель адиабаты.
  - `image` *(file, optional)*: Файл изображения.
  - `video` *(file, optional)*: Файл видеозаписи.
- **Код ответа**: `201 Created`
- **Пример ответа**:
```json
{
  "id": 8,
  "name": "Метан CH4",
  "short_description": "Перспективное углеводородное ракетное топливо",
  "status": "draft",
  "image_url": "http://localhost:9000/propellants/propellant_1791316484797_ublwk7.jpg",
  "video_url": "http://localhost:9000/propellants/exhaust_1791316484821_8q0lut.jpg",
  "molar_mass": 16.04,
  "specific_heat_ratio": 1.31,
  "creator_id": 1,
  "likes_count": 0,
  "is_creator": 1,
  "is_liked": 0
}
```

---

### 5.3. `GET /api/propellants/draft` — Получение полей черновика

- **Назначение**: Получение текущего черновика текущего пользователя без указания ID в URL.
- **Параметры**: Отсутствуют (пользователь определяется синглтоном `getCurrentUser()`).
- **Код ответа**: `200 OK` (или `404 Not Found`, если черновик отсутствует).
- **Пример ответа**:
```json
{
  "id": 2,
  "name": "Ксенон",
  "short_description": "Тяжелый благородный газ для электротермических ступеней ЯРД.",
  "status": "draft",
  "image_url": "http://localhost:9000/propellants/propellant_ch4.jpg",
  "video_url": "http://localhost:9000/propellants/video_exhaust_ch4.mp4",
  "molar_mass": 131.293,
  "specific_heat_ratio": 1.67,
  "creator_id": 1,
  "likes_count": 2,
  "is_creator": 1,
  "is_liked": 0
}
```

---

### 5.4. `PUT /api/propellants/:id/publish` — Публикация услуги

- **Назначение**: Публикация созданного черновика (перевод из статуса `draft` в `published`).
- **Параметры URL**:
  - `id` *(number, required)*: Идентификатор услуги.
- **Ограничения**: Выполняется только создателем записи. Если запись не в статусе `draft`, возвращается `400 Bad Request`.
- **Код ответа**: `200 OK`
- **Пример ответа**:
```json
{
  "id": 2,
  "name": "Ксенон",
  "status": "published",
  "is_creator": 1,
  "is_liked": 0,
  "likes_count": 2
}
```

---

### 5.5. `GET /api/propellants/feed` — Лента опубликованных услуг (без ID)

- **Назначение**: Получение первой карточки опубликованных услуг для слайдера/карусели ленты.
- **Код ответа**: `200 OK`
- **Пример ответа**:
```json
{
  "item": {
    "id": 1,
    "name": "Жидкий водород",
    "short_description": "Эффективное рабочее тело с наименьшей молярной массой.",
    "status": "published",
    "image_url": "http://localhost:9000/propellants/propellant_h2.jpg",
    "video_url": "http://localhost:9000/propellants/video_exhaust_h2.mp4",
    "molar_mass": 2.016,
    "specific_heat_ratio": 1.41,
    "creator_id": 1,
    "likes_count": 3,
    "is_creator": 1,
    "is_liked": 1
  },
  "next_id": 5
}
```

---

### 5.6. `GET /api/propellants/feed?id=:id&next=true` — Лента по курсору ID

- **Назначение**: Переход к следующей услуге в карусели ленты. Реализована циклическая навигация: после последнего элемента возвращается первый.
- **Параметры Query**:
  - `id` *(number, required)*: Текущий ID услуги.
  - `next` *(boolean, required)*: Флаг перемещения вперед (`true`).
- **Код ответа**: `200 OK`
- **Пример ответа**:
```json
{
  "item": {
    "id": 5,
    "name": "Диборан",
    "status": "published",
    "likes_count": 1,
    "is_creator": 1,
    "is_liked": 0
  },
  "next_id": 7
}
```

---

### 5.7. `POST /api/propellants/:id/like` — Поставить / снять лайк

- **Назначение**: Установка или снятие лайка текущим пользователем.
- **Параметры URL**:
  - `id` *(number, required)*: ID услуги.
- **Тело запроса (`application/json`)**:
```json
{
  "like": 1
}
```
*(где `1` — поставить лайк, `0` — снять лайк)*
- **Код ответа**: `200 OK`
- **Пример ответа**:
```json
{
  "success": true,
  "liked": 1,
  "likes_count": 4
}
```

---

### 5.8. `DELETE /api/propellants/:id` — Мягкое удаление услуги

- **Назначение**: Удаление услуги автором (soft delete). Статус устанавливается в `deleted`.
- **Параметры URL**:
  - `id` *(number, required)*: ID услуги.
- **Ограничения**: Удалить может только создатель (`creator_id === currentUser.id`).
- **Код ответа**: `200 OK`
- **Пример ответа**:
```json
{
  "success": true,
  "message": "Услуга с ID 8 успешно удалена (soft delete)"
}
```

---

### 5.9. `POST /api/auth/register` — Регистрация нового пользователя

- **Назначение**: Регистрация новой учетной записи инженера.
- **Тело запроса (`application/json`)**:
```json
{
  "username": "test_user",
  "email": "test_user@example.com",
  "password": "password123"
}
```
- **Код ответа**: `201 Created` (или `409 Conflict` при дубликате логина/почты).
- **Пример ответа**:
```json
{
  "id": 6,
  "username": "test_user",
  "email": "test_user@example.com",
  "message": "Пользователь успешно зарегистрирован"
}
```

---

### 5.10. `POST /api/auth/login` — Вход пользователя

- **Назначение**: Аутентификация пользователя по логину и паролю.
- **Тело запроса (`application/json`)**:
```json
{
  "username": "user_1",
  "password": "password123"
}
```
- **Код ответа**: `200 OK` (или `401 Unauthorized` при неверных данных).
- **Пример ответа**:
```json
{
  "success": true,
  "message": "Аутентификация успешна",
  "user": {
    "id": 1,
    "username": "user_1",
    "email": "user1@example.com"
  }
}
```

