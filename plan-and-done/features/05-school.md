# 5. «Школа» (Campaign / Course Mode)

> ⏳ **Статус: Запланировано**

---

## Концепция

Структурированное прохождение тем в формате «курсов». Каждый курс — цепочка уроков с нарастающей сложностью. В конце курса — экзамен. При успешной сдаче — диплом.

## Структура курса

| Уровень | Название | Вопросов | Таймер | Порог |
|---------|----------|----------|--------|-------|
| 1 | Новичок | 5 | Без таймера | 80% |
| 2 | Любитель | 10 | 30 сек/вопрос | 80% |
| 3 | Знаток | 15 | 20 сек/вопрос | 85% |
| Экзамен | — | 20 | 15 сек/вопрос | 90% |

Проходить нужно последовательно. Каждый уровень открывается после сдачи предыдущего.

## Структура БД

```sql
CREATE TABLE courses (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  topic_id INTEGER NOT NULL REFERENCES topics(id),
  name TEXT NOT NULL,
  description TEXT,
  sort_order INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE user_course_progress (
  user_id INTEGER NOT NULL REFERENCES users(id),
  course_id INTEGER NOT NULL REFERENCES courses(id),
  level INTEGER NOT NULL DEFAULT 1,
  best_score REAL NOT NULL DEFAULT 0,
  passed_exam INTEGER NOT NULL DEFAULT 0,
  diploma_date TEXT,
  PRIMARY KEY (user_id, course_id)
);

ALTER TABLE users ADD COLUMN diplomas_count INTEGER NOT NULL DEFAULT 0;
```

## Ключевые моменты для проработки

- [ ] Таблицы `courses`, `user_course_progress`
- [ ] Генерация курсов из существующих тем (1 тема = 1 курс)
- [ ] Компонент `CourseView` — выбор курса, прогресс
- [ ] Компонент `CourseLevel` — прохождение уровня
- [ ] Компонент `CourseExam` — экзамен
- [ ] Система дипломов (отметка в профиле, счётчик)
- [ ] Прогресс-бар и мотивационные элементы
- [ ] Влияние на общий `score` (бонусные очки за диплом)
