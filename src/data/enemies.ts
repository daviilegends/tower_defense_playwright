import type { EnemyData } from '../types'

export const ENEMY_DEFS: Record<string, EnemyData> = {
  'input-username': {
    id: 'input-username',
    domNode: {
      tag: 'input',
      id: 'user-name',
      classes: ['form-input'],
      attrs: { type: 'text', placeholder: 'Username' },
      role: 'textbox',
      ariaLabel: 'Username'
    },
    hp: 60,
    speed: 32,
    xp: 10,
    tier: 1
  },
  'input-password': {
    id: 'input-password',
    domNode: {
      tag: 'input',
      id: 'password',
      classes: ['form-input'],
      attrs: { type: 'password', placeholder: 'Password' },
      role: 'textbox',
      ariaLabel: 'Password'
    },
    hp: 60,
    speed: 38,
    xp: 10,
    tier: 1
  },
  'button-login': {
    id: 'button-login',
    domNode: {
      tag: 'input',
      id: 'login-button',
      classes: ['btn_action'],
      attrs: { type: 'submit', value: 'Login' },
      role: 'button',
      text: 'Login'
    },
    hp: 100,
    speed: 26,
    xp: 20,
    tier: 1
  }
}
