import { z } from 'zod';

export const LoginSchema = z.object({
  email: z.string().email('Email inválido'),
  password: z.string().min(6, 'Senha deve ter no mínimo 6 caracteres').max(100),
});

export const RegisterSchema = z.object({
  email: z.string().email('Email inválido'),
  password: z.string().min(6, 'Senha deve ter no mínimo 6 caracteres').max(100),
  username: z.string().min(3, 'Username deve ter no mínimo 3 caracteres').max(20),
});

export const MoveSchema = z.object({
  x: z.number().int().min(0).max(255),
  y: z.number().int().min(0).max(255),
});

export const ChatSchema = z.object({
  message: z.string().min(1).max(200),
  channel: z.enum(['global', 'party', 'guild', 'whisper']),
});
