import { AnswerResultItem } from '../../molecules/AnswerResultItem/AnswerResultItem'
import type { GameResult } from '../GameBoard/GameBoard'
import styles from './GameResults.module.scss'

export interface GameResultsProps {
  result: GameResult
  score?: { totalAwarded: number; breakdown: { questionId: number; points: number }[] }
}

const headers = [
  'Вы сегодня творите чудеса!',
  'Отличный результат!',
  'Неплохо, продолжайте в том же духе!',
  'Есть куда расти!',
  'Попробуйте ещё раз!',
]

export function GameResults({ result, score }: GameResultsProps) {
  const accuracy = result.total > 0 ? Math.round((result.correct / result.total) * 100) : 0
  const header = accuracy >= 80 ? headers[0] : accuracy >= 60 ? headers[1] : accuracy >= 40 ? headers[2] : headers[3]
  const avgSec = result.total > 0 ? (result.timeCs / result.total / 100).toFixed(0) : '0'
  const totalMin = Math.floor(result.timeCs / 6000)
  const missed = result.total - result.questions.filter((q) => q.selectedIndex !== null).length

  return (
    <div>
      <h1>Результаты игры</h1>

      <div className={styles.header}>
        <span className={styles.headerText}>{header}</span>
      </div>

      <div className={styles.stats}>
        За&nbsp;{totalMin}&nbsp;минут вы ответили верно на&nbsp;
        <span className={styles.amount}>{result.correct}&nbsp;из&nbsp;{result.total}&nbsp;вопросов ({accuracy}%).</span>
        <br />
        {missed > 0 && (
          <>На&nbsp;<span className={styles.missed}>{missed}&nbsp;вопроса</span> вы ответить не успели.<br /></>
        )}
        <span className={styles.avgTime}>Среднее время на ответ — {avgSec} секунд.</span>
        {score !== undefined && (
          <>
            <br />
            <span className={styles.scoreLine}>Заработано очков: <strong>{score.totalAwarded}</strong></span>
          </>
        )}
      </div>

      {result.questions.map((item, i) => (
        <AnswerResultItem
          key={i}
          index={i}
          question={item.question.text}
          imageUrl={item.question.imageUrl}
          answers={item.question.answers}
          correctIndex={item.correctIndex}
          selectedIndex={item.selectedIndex}
          note={item.question.note}
          points={score?.breakdown[i]?.points}
        />
      ))}
    </div>
  )
}
