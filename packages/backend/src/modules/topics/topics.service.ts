import { db } from '../../db/connection.js'

export interface Category {
  id: number
  name: string
  icon: string
  topics: Topic[]
}

export interface Topic {
  id: number
  name: string
  question_count: number
}

export interface Question {
  id: number
  text: string
  image_url: string | null
  answers: string[]
  correctIndex: number
  explanation: string | null
  note: string | null
}

export function getCategories(): Category[] {
  const cats = db.prepare('SELECT * FROM categories ORDER BY sort_order').all() as {
    id: number; name: string; icon: string
  }[]

  return cats.map((cat) => {
    const topics = db
      .prepare(
        `SELECT t.id, t.name, COUNT(q.id) as question_count
         FROM topics t
         LEFT JOIN questions q ON q.topic_id = t.id
         WHERE t.category_id = ?
         GROUP BY t.id
         ORDER BY t.sort_order`,
      )
      .all(cat.id) as Topic[]

    return { ...cat, topics }
  })
}

export function getQuestions(topicIds: number[], count?: number, hideAnswer?: boolean): Question[] {
  const placeholders = topicIds.map(() => '?').join(',')
  let sql = `
    SELECT id, text, image_url, answer_1, answer_2, answer_3, answer_4, correct_index, explanation, note
    FROM questions
    WHERE topic_id IN (${placeholders})
    ORDER BY RANDOM()
  `
  if (count && count > 0) {
    sql += ` LIMIT ${count}`
  }

  const rows = db.prepare(sql).all(...topicIds) as {
    id: number; text: string; image_url: string | null
    answer_1: string; answer_2: string; answer_3: string; answer_4: string
    correct_index: number; explanation: string | null; note: string | null
  }[]

  return rows.map((r) => {
    const answers = [r.answer_1, r.answer_2, r.answer_3, r.answer_4]
    const correctAnswer = answers[r.correct_index]

    // Shuffle answers for display
    const indices = [0, 1, 2, 3].sort(() => Math.random() - 0.5)
    const shuffled = indices.map((i) => answers[i])
    const newCorrectIndex = shuffled.indexOf(correctAnswer)

    const result: Question = {
      id: r.id,
      text: r.text,
      image_url: r.image_url,
      answers: shuffled,
      correctIndex: hideAnswer ? -1 : newCorrectIndex,
      explanation: hideAnswer ? null : r.explanation,
      note: (r as any).note || null,
    }
    return result
  })
}
