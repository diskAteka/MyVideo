# Скриншоты 

### Страница входа:
<img width="2538" height="1390" alt="image" src="https://github.com/user-attachments/assets/5035f870-6b9c-4cd2-bb86-a11de17fe40d" />

### Страница регистрации:
<img width="2535" height="1385" alt="image" src="https://github.com/user-attachments/assets/db27a9b1-51bb-444e-b596-4da5fb9e6596" />

### Главная:
<img width="2558" height="1390" alt="image" src="https://github.com/user-attachments/assets/66715b50-2be0-49f5-a475-07c6c9282f78" />

### Страница загрузки:
<img width="2558" height="1391" alt="image" src="https://github.com/user-attachments/assets/ce5f67d4-f622-4fb7-bf83-6896703ae733" />

### Страница видео:
<img width="2540" height="1391" alt="image" src="https://github.com/user-attachments/assets/55bbb809-b8a5-4cac-b8ec-7bf403212a54" />




# 📖 Инструкция по развертыванию проекта VideohostingExpress

## 🚀 Быстрый старт

### 1. Клонирование репозитория

```bash
git clone https://github.com/diskAteka/MyVideo.git
cd MyVideo
```

---

### 2. Установка Git LFS (обязательно)

Проект использует **Git LFS (Large File Storage)** для хранения бинарных файлов. Без установки LFS большие файлы не скачаются, и проект не запустится.

#### Установка:

- **Скачайте и установите Git LFS** с официального сайта:  
  👉 [https://git-lfs.github.com/](https://git-lfs.github.com/)

#### Настройка:

В терминале (из папки проекта) выполните:

```bash
git lfs install
git lfs pull
```

> Команда `git lfs pull` принудительно скачает все файлы, отслеживаемые через LFS.

---

### 3. Запуск проекта через Docker

После клонирования и настройки LFS выполните сборку и запуск контейнеров:

```bash
docker-compose build --no-cache
docker-compose up -d
```

Проект будет доступен по адресу:  
👉 `http://localhost`

---

## ⚙️ Настройка S3 и базы данных

### 📌 По умолчанию

**Проект уже содержит предварительно настроенные S3-ключи и параметры подключения к БД.**  
Вы можете сразу запустить проект и использовать его без дополнительной настройки.

---

### 🔧 Ручная настройка (опционально)

Если вы хотите использовать **собственные S3-ключи** или изменить параметры базы данных:

1. Остановите и удалите текущие контейнеры с данными:

```bash
docker-compose down -v
```

2. Пересоберите контейнеры:

```bash
docker-compose build --no-cache
```

3. Запустите проект:

```bash
docker-compose up -d
```

4. Созданные вами S3-ключи и параметры БД **необходимо указать** в файле `.env` в корне проекта.

> ⚠️ **Важно:** После ручной настройки все старые ключи и данные будут сброшены.
