// Форматтеры для отображения данных

function pluralize(n, forms) {
  // forms = ['день', 'дня', 'дней']
  const mod10 = n % 10;
  const mod100 = n % 100;
  if (mod100 >= 11 && mod100 <= 14) return forms[2];
  if (mod10 === 1) return forms[0];
  if (mod10 >= 2 && mod10 <= 4) return forms[1];
  return forms[2];
}

export function formatUploadDate(dateString) {
  if (!dateString) return 'Неизвестная дата';

  const date = new Date(dateString);
  if (isNaN(date.getTime())) return 'Неизвестная дата';

  const diffDays = Math.floor((Date.now() - date.getTime()) / 86400000);

  if (diffDays === 0) return 'Сегодня';
  if (diffDays === 1) return 'Вчера';
  if (diffDays < 7) {
    return `${diffDays} ${pluralize(diffDays, ['день', 'дня', 'дней'])} назад`;
  }
  if (diffDays < 30) {
    const weeks = Math.floor(diffDays / 7);
    return `${weeks} ${pluralize(weeks, ['неделю', 'недели', 'недель'])} назад`;
  }
  return date.toLocaleDateString('ru-RU', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
}

export function getInitial(name) {
  if (!name) return 'U';
  return name.trim()[0].toUpperCase();
}

export function formatRelativeDate(dateString) {
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return '';

  const diffMs = Date.now() - date.getTime();
  const diffMin = Math.floor(diffMs / 60000);
  const diffH = Math.floor(diffMs / 3600000);
  const diffD = Math.floor(diffMs / 86400000);

  if (diffMin < 1) return 'только что';
  if (diffMin < 60) return `${diffMin} мин. назад`;
  if (diffH < 24) return `${diffH} ч. назад`;
  if (diffD < 7) return `${diffD} дн. назад`;
  return date.toLocaleDateString('ru-RU', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}