export type MenuStatus = 'idle' | 'loading' | 'loaded' | 'error';

export type MenuConnection = 'offline' | 'online' | 'reconnecting';

export type MenuState = {
  status: MenuStatus;
  connection: MenuConnection;
  revision: number | null;
};
