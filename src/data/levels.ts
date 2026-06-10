import type { LevelConfig } from '../types'

export const LEVELS: LevelConfig[] = [
  {
    id: 1,
    name: 'SauceDemo: Login Page',
    availableTowers: ['css-tower'],
    tip: 'Un ID es como un const — único e irrepetible. Escribe #user-name para atacar el input.',
    waves: [
      {
        enemies: [
          { dataId: 'input-username', delay: 0 },
          { dataId: 'input-password', delay: 2500 },
        ]
      },
      {
        enemies: [
          { dataId: 'input-username', delay: 0 },
          { dataId: 'input-password', delay: 1500 },
          { dataId: 'button-login', delay: 3000 },
        ]
      },
      {
        enemies: [
          { dataId: 'input-username', delay: 0 },
          { dataId: 'input-password', delay: 1000 },
          { dataId: 'button-login', delay: 2000 },
          { dataId: 'input-username', delay: 3500 },
          { dataId: 'input-password', delay: 4500 },
        ]
      }
    ]
  }
]
