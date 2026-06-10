export interface DomElement {
  tag: string
  id?: string
  classes: string[]
  attrs: Record<string, string>
  text?: string
  role?: string
  ariaLabel?: string
}

export interface EnemyData {
  id: string
  domNode: DomElement
  hp: number
  speed: number
  xp: number
  tier: 1 | 2 | 3
}

export interface WaveConfig {
  enemies: { dataId: string; delay: number }[]
}

export interface LevelConfig {
  id: number
  name: string
  waves: WaveConfig[]
  availableTowers: string[]
  tip: string
}
