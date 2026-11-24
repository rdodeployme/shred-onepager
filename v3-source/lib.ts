export const BP = process.env.NEXT_PUBLIC_BASE_PATH || '';
export const img = (name: string) => `${BP}/img/${name}`;
