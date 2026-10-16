export type MenuStatus = 'idle' | 'loading' | 'loaded' | 'error';

export type MenuConnection = 'connecting' | 'online' | 'reconnecting' | 'offline';

export type MenuState = {
  status: MenuStatus;
  connection: MenuConnection;
  revision: number | null;
};
