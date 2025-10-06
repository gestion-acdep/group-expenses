export const port = process.env.PORT ? Number(process.env.PORT) : 4050;
export const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';