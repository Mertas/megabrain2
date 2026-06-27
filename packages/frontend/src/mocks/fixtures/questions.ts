import type { Question } from '../../components/organisms/GameBoard/GameBoard'

export const mockQuestions: Question[] = [
  {
    id: 1,
    text: 'На какой планете находится самая высокая гора в Солнечной системе?',
    answers: ['Марс', 'Уран', 'Венера', 'Нептун'],
    imageUrl: '/i/sample_question_pic.jpg',
  },
  {
    id: 2,
    text: 'У какой планеты больше всего лун?',
    answers: ['Юпитер', 'Уран', 'Венера', 'Нептун'],
    imageUrl: '/i/sample_question_pic_2.jpg',
  },
  {
    id: 3,
    text: 'Сколько планет в Солнечной системе?',
    answers: ['7', '8', '9', '10'],
  },
  {
    id: 4,
    text: 'Ближайшая к Солнцу планета?',
    answers: ['Меркурий', 'Венера', 'Земля', 'Марс'],
  },
  {
    id: 5,
    text: 'Какая планета самая большая в Солнечной системе?',
    answers: ['Юпитер', 'Сатурн', 'Уран', 'Нептун'],
  },
  {
    id: 6,
    text: 'На какой планете есть кольца?',
    answers: ['Сатурн', 'Марс', 'Венера', 'Меркурий'],
  },
]
