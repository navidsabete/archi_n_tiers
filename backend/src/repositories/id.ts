import crypto from 'crypto';

export const newId = (): string => crypto.randomUUID();

