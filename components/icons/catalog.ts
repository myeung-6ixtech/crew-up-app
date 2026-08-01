/** Semantic icon names → Unicons ids (Iconify `uil:*`). */
export const AppIcons = {
  home: 'home',
  network: 'users-alt',
  events: 'calendar',
  messages: 'comment-alt-dots',
  friends: 'heart',
  profile: 'user-circle',
  email: 'envelope',
  upload: 'upload',
  settings: 'setting',
  shield: 'shield-check',
  signOut: 'signout',
  edit: 'edit',
  privacy: 'eye-slash',
  roster: 'file-alt',
  verified: 'shield-check',
  pending: 'clock',
  chevronRight: 'arrow-right',
  chevronDown: 'angle-down',
  menu: 'bars',
  add: 'plus-circle',
  mapPoint: 'map-marker',
  globe: 'globe',
} as const;

export type AppIconName = keyof typeof AppIcons;

export type UniconsIconId = (typeof AppIcons)[AppIconName];
