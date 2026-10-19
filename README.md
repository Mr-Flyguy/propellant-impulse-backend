# Propellant Impulse Backend — Веб-сервис базы данных видов топлива ЯРД

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

Сервис использует 3 связанные таблицы в PostgreSQL:

### 3.1. Таблица `users` (Инженеры / Пользователи системы)

| Поле | Тип данных | Ограничения | Описание |
| :--- | :--- | :--- | :--- |
| `id` | `SERIAL` | `PRIMARY KEY` | Уникальный идентификатор инженера |
| `username` | `VARCHAR(64)` | `NOT NULL, UNIQUE` | Логин пользователя |
| `email` | `VARCHAR(128)` | `NOT NULL, UNIQUE` | Электронная почта |
| `password` | `VARCHAR(255)` | `NOT NULL` | Пароль пользователя (хэш) |
| `created_at` | `TIMESTAMPTZ` | `DEFAULT CURRENT_TIMESTAMP` | Дата и время регистрации |

### 3.2. Таблица `propellants` (Рабочие тела ЯРД / Услуги)

| Поле | Тип данных | Ограничения | Описание |
| :--- | :--- | :--- | :--- |
| `id` | `SERIAL` | `PRIMARY KEY` | Уникальный идентификатор рабочего тела |
| `name` | `VARCHAR(100)` | `NOT NULL` | Наименование рабочего тела (с химической формулой) |
| `chemical_formula` | `VARCHAR(32)` | `NULL` | Химическая формула (опционально) |
| `short_description`| `TEXT` | `NULL` | Краткое описание физико-химических свойств |
| `engineering_analysis` | `TEXT` | `NULL` | Детальный инженерный термодинамический анализ |
| `status` | `VARCHAR(20)` | `NOT NULL, CHECK (status IN ('draft', 'published', 'deleted'))` | Жизненный цикл записи |
| `image_url` | `VARCHAR(255)` | `NOT NULL` | URL схемы/фото в объектном хранилище Minio |
| `video_url` | `VARCHAR(255)` | `NOT NULL` | URL видеозаписи истечения факела в Minio |
| `molar_mass` | `DECIMAL(8, 3)` | `NOT NULL` | Молярная масса рабочего тела $\mu$ (г/моль) |
| `reactor_temperature_k` | `INT` | `DEFAULT 2400` | Оптимальная температура в активной зоне реактора (K) |
| `specific_heat_ratio` | `DECIMAL(8, 3)` | `DEFAULT 1.25` | Показатель адиабаты $\gamma$ |
| `specific_impulse` | `INT` | `NOT NULL` | Расчетный удельный импульс $I_{sp}$ (сек) |
| `creator_id` | `INT` | `NOT NULL, FOREIGN KEY -> users(id) ON DELETE RESTRICT` | Автор записи (назначается сервером) |
| `created_at` | `TIMESTAMPTZ` | `DEFAULT CURRENT_TIMESTAMP` | Время добавления записи |
| `updated_at` | `TIMESTAMPTZ` | `DEFAULT CURRENT_TIMESTAMP` | Время последнего обновления |

### 3.3. Таблица `propellant_likes` (Связь «Многие-ко-многим»: Лайки)

| Поле | Тип данных | Ограничения | Описание |
| :--- | :--- | :--- | :--- |
| `user_id` | `INT` | `PRIMARY KEY, FOREIGN KEY -> users(id)` | Пользователь, поставивший отметку |
| `propellant_id` | `INT` | `PRIMARY KEY, FOREIGN KEY -> propellants(id)` | Оцениваемое рабочее тело |
| `created_at` | `TIMESTAMPTZ` | `DEFAULT CURRENT_TIMESTAMP` | Время выставления отметки |

---

## 4. Бизнес-правила и особенности реализации

1. **Концепция пользователя по умолчанию (Singleton)**:
   - В текущей версии для демонстрации методов предметной области используется текущий пользователь `CurrentUserService` (`id: 1, username: 'engineer_maksim'`).
   - Клиент **не может** передавать `creator_id`, `id` или `status` при создании рабочего тела. Все системные поля назначаются сервером.
2. **Жизненный цикл статусов (`draft` $\to$ `published` $\to$ `deleted`)**:
   - Новая запись создается только в статусе `draft`.
   - Опубликовать (`published`) можно **только** черновик (`draft`). Перевод обратно в черновик невозможен.
   - Опубликовать и удалить запись может **только её создатель** (`creator_id === currentUser.id`).
   - Удаление является **мягким (soft delete)**: статус переводится в `deleted`. Физически запись сохраняется в БД, но исключается из всех списков, ленты и каталога для клиентов.
3. **Хранилище Minio**:
   - Изображения и видео загружаются в бакет `propellants` на Minio через `multipart/form-data`.
   - Имена файлов генерируются на латинице с временными метками: `${prefix}_${Date.now()}_${random}.${ext}`.
4. **Вычисляемые флаги `0/1` в ответах API**:
   - `is_creator`: `1` если запись создана текущим пользователем, `0` иначе (используется клиентом в Каталоге для отображения действия удаления).
   - `is_liked`: `1` если текущий пользователь лайкнул запись, `0` иначе (используется клиентом в Ленте для индикации лайка).
   - `likes_count`: общее количество лайков.

---

## 5. Документация REST API (10 методов)

Базовый путь всех API-методов: `/api/*`.

### Домен рабочих тел (7 методов: 3 GET, 1 POST, 1 PUT, 1 DELETE, 1 POST-лайк)

#### 5.1. `GET /api/propellants` — Каталог опубликованных рабочих тел (с фильтром)
- **Назначение**: Получение каталога опубликованных рабочих тел с поддержкой фильтрации. Записи в статусе `deleted` исключены.
- **Параметры Query**:
  - `max_molar_mass` *(number, optional)*: Максимальная молярная масса (фильтр $\le$).
- **Код ответа**: `200 OK`
- **Пример ответа**:
```json
[
  {
    "id": 1,
    "name": "Жидкий водород H₂",
    "short_description": "Эффективное рабочее тело за счёт минимальной массы и предельного импульса.",
    "status": "published",
    "image_url": "http://localhost:9000/propellants/propellant_h2.jpg",
    "video_url": "http://localhost:9000/propellants/video_exhaust_h2.mp4",
    "molar_mass": 2.016,
    "specific_heat_ratio": 1.41,
    "creator_id": 1,
    "likes_count": 4,
    "is_creator": 1,
    "is_liked": 1
  }
]
```

#### 5.2. `POST /api/propellants` — Создание черновика (Шаг 1 мастера: файлы и имя)
- **Назначение**: Создание черновика с прикреплением медиафайлов. Все термодинамические характеристики заполняются на втором шаге мастера (при публикации).
- **Формат запроса**: `multipart/form-data`
- **Поля формы (строго 3 поля)**:
  - `name` *(string, required)*: Наименование рабочего тела (например, `Ксенон`).
  - `image` *(file, optional)*: Файл изображения (загружается в Minio).
  - `video` *(file, optional)*: Файл видеозаписи (загружается в Minio).
- **Код ответа**: `201 Created`
- **Пример ответа**:
```json
{
  "id": 8,
  "name": "Ксенон",
  "short_description": "",
  "status": "draft",
  "image_url": "http://localhost:9000/propellants/propellant_1791316484797_ublwk7.jpg",
  "video_url": "http://localhost:9000/propellants/exhaust_1791316484821_8q0lut.mp4",
  "molar_mass": 16.04,
  "specific_heat_ratio": 1.32,
  "creator_id": 1,
  "likes_count": 0,
  "is_creator": 1,
  "is_liked": 0
}
```

#### 5.3. `GET /api/propellants/draft` — Получение полей черновика текущего пользователя
- **Назначение**: Получение данных черновика текущего пользователя без передачи ID в URL (Шаг 2 мастера).
- **Параметры**: Отсутствуют (пользователь определяется контекстом запроса).
- **Код ответа**: `200 OK` (или `404 Not Found`).
- **Пример ответа**:
```json
{
  "id": 8,
  "name": "Ксенон",
  "short_description": "",
  "status": "draft",
  "image_url": "http://localhost:9000/propellants/propellant_1791316484797_ublwk7.jpg",
  "video_url": "http://localhost:9000/propellants/exhaust_1791316484821_8q0lut.mp4",
  "molar_mass": 16.04,
  "specific_heat_ratio": 1.32,
  "creator_id": 1,
  "likes_count": 0,
  "is_creator": 1,
  "is_liked": 0
}
```

#### 5.4. `PUT /api/propellants/:id/publish` — Публикация рабочего тела (Шаг 2 мастера)
- **Назначение**: Перевод черновика в статус `published` с возможностью обновления термодинамических свойств.
- **Параметры URL**: `id` *(number, required)*
- **Тело запроса (`application/json`, optional)**:
```json
{
  "molar_mass": 131.29,
  "specific_heat_ratio": 1.67,
  "short_description": "Тяжелый одноатомный благородный газ для электротермических ступеней ЯРД."
}
```
- **Ограничения**: Выполняется только создателем записи. Если статус не `draft`, возвращается `400 Bad Request`.
- **Код ответа**: `200 OK`
- **Пример ответа**:
```json
{
  "id": 8,
  "name": "Ксенон",
  "short_description": "Тяжелый одноатомный благородный газ для электротермических ступеней ЯРД.",
  "status": "published",
  "image_url": "http://localhost:9000/propellants/propellant_1791316484797_ublwk7.jpg",
  "video_url": "http://localhost:9000/propellants/exhaust_1791316484821_8q0lut.mp4",
  "molar_mass": 131.29,
  "specific_heat_ratio": 1.67,
  "creator_id": 1,
  "likes_count": 0,
  "is_creator": 1,
  "is_liked": 0
}
```

#### 5.5. `GET /api/propellants/feed?id=:id&next=true` — Лента опубликованных рабочих тел
- **Назначение**: Просмотр опубликованных рабочих тел в полноэкранной ленте с циклической навигацией. Возвращает напрямую сущность `PropellantResponseDto` с флагом `is_liked: 0/1`.
- **Параметры Query**:
  - `id` *(number, optional)*: ID текущего просматриваемого элемента.
  - `next` *(boolean, optional)*: Флаг перехода к следующему элементу (`true`).
- **Код ответа**: `200 OK`
- **Пример ответа**:
```json
{
  "id": 2,
  "name": "Метан CH₄",
  "short_description": "Перспективное углеводородное ракетное топливо для ЖРД и ЯРД.",
  "status": "published",
  "image_url": "http://localhost:9000/propellants/propellant_ch4.jpg",
  "video_url": "http://localhost:9000/propellants/video_exhaust_ch4.mp4",
  "molar_mass": 16.04,
  "specific_heat_ratio": 1.31,
  "creator_id": 1,
  "likes_count": 2,
  "is_creator": 1,
  "is_liked": 0
}
```

#### 5.6. `POST /api/propellants/:id/like` — Поставить / снять лайк
- **Назначение**: Установка или снятие отметки одобрения инженеров (`1` — поставить, `0` — снять).
- **Параметры URL**: `id` *(number, required)*
- **Тело запроса (`application/json`)**:
```json
{
  "like": 1
}
```
- **Код ответа**: `200 OK`
- **Пример ответа**:
```json
{
  "success": true,
  "liked": 1,
  "likes_count": 5
}
```

#### 5.7. `DELETE /api/propellants/:id` — Мягкое удаление рабочего тела (Soft delete)
- **Назначение**: Удаление рабочего тела создателем. Статус переводится в `deleted`, данные сохраняются в БД.
- **Параметры URL**: `id` *(number, required)*
- **Ограничения**: Удалить может только автор (`creator_id === currentUser.id`).
- **Код ответа**: `200 OK`
- **Пример ответа**:
```json
{
  "success": true,
  "message": "Услуга с ID 8 успешно удалена (soft delete)"
}
```

---

### Домен пользователей (3 метода: 3 POST)

#### 5.8. `POST /api/auth/register` — Регистрация нового инженера
- **Назначение**: Регистрация новой учетной записи пользователя в таблице `users`.
- **Тело запроса (`application/json`)**:
```json
{
  "username": "test_engineer",
  "email": "engineer@bmstu.ru",
  "password": "secure_password_123"
}
```
- **Код ответа**: `201 Created` (или `409 Conflict` при дубликате логина/почты).
- **Пример ответа**:
```json
{
  "id": 5,
  "username": "test_engineer",
  "email": "engineer@bmstu.ru",
  "message": "Пользователь успешно зарегистрирован"
}
```

#### 5.9. `POST /api/auth/login` — Вход в систему (Аутентификация)
- **Назначение**: Аутентификация пользователя по логину и паролю.
- **Тело запроса (`application/json`)**:
```json
{
  "username": "test_engineer",
  "password": "secure_password_123"
}
```
- **Код ответа**: `200 OK`
- **Пример ответа**:
```json
{
  "status": "ok",
  "user": {
    "id": 1,
    "username": "test_engineer"
  },
  "message": "Аутентификация успешна"
}
```

#### 5.10. `POST /api/auth/logout` — Завершение сессии (Деавторизация)
- **Назначение**: Выход пользователя из системы.
- **Код ответа**: `200 OK`
- **Пример ответа**:
```json
{
  "status": "ok",
  "message": "Деавторизация успешна"
}
```

