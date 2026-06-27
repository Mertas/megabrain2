import { useState } from 'react'
import { FixtureLayout } from '../../organisms/FixtureLayout'
import { Tabs } from './Tabs'
import { Input } from '../../atoms/Input/Input'

const tabs = [
  { key: 'file', label: '\u266B файл', title: 'mp3, flv-видео или картинки gif, jpg, png' },
  { key: 'uri', label: 'ссылка на \u266B файл', title: 'ссылка на mp3, flv-видео или картинки gif, jpg, png' },
  { key: 'video', label: 'youtube-видео' },
]

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: 20 }}>
      <h3 style={{ fontSize: 14, color: '#555', marginBottom: 8 }}>{title}</h3>
      {children}
    </div>
  )
}

export default function TabsFixture() {
  const [tab, setTab] = useState('file')

  return (
    <FixtureLayout title="Tabs">
      <Section title="Медиа-загрузка (из new_question)">
        <Tabs items={tabs} activeKey={tab} onChange={setTab}>
          {tab === 'file' && <Input type="file" />}
          {tab === 'uri' && <Input placeholder="https://example.com/pic.jpg" />}
          {tab === 'video' && <Input placeholder="https://youtube.com/watch?v=..." />}
        </Tabs>
      </Section>
    </FixtureLayout>
  )
}
