declare global {
  type Environment = {
    name: 'development' | 'production';
    API_URL: string;
  };
}

export {};
