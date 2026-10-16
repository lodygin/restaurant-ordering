export type MenuStatus = 'idle' | 'loading' | 'loaded' | 'error';

export type MenuState = {
  status: MenuStatus;
  revision: number | null;
};
