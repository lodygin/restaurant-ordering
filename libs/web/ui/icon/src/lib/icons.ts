// Material Symbols Outlined, weight 400, on its 960-unit grid
const PATHS: Record<string, string> = {
  add: 'M440-440H200v-80h240v-240h80v240h240v80H520v240h-80v-240Z',
  remove: 'M200-440v-80h560v80H200Z',
  chevron_left: 'M560-240 320-480l240-240 56 56-184 184 184 184-56 56Z',
  chevron_right: 'M504-480 320-664l56-56 240 240-240 240-56-56 184-184Z',
};

export const ICONS = Object.entries(PATHS).map(([name, path]) => ({
  name,
  svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 -960 960 960" fill="currentColor"><path d="${path}"/></svg>`,
}));
