import { prisma } from '@/lib/prisma';
import { LogType, LogLevel } from '@prisma/client';

interface LogOptions {
  type: LogType;
  level?: LogLevel;
  message: string;
  meta?: Record<string, unknown>;
  userId?: string;
}

export async function log(options: LogOptions): Promise<void> {
  try {
    await prisma.systemLog.create({
      data: {
        type: options.type,
        level: options.level || LogLevel.INFO,
        message: options.message,
        metaJson: options.meta ? JSON.stringify(options.meta) : null,
        userId: options.userId,
      },
    });
  } catch (error) {
    // Don't let logging errors break the application
    console.error('Failed to write log:', error);
  }
}

export async function logError(
  type: LogType,
  error: unknown,
  meta?: Record<string, unknown>,
  userId?: string
): Promise<void> {
  const message = error instanceof Error ? error.message : String(error);
  const stack = error instanceof Error ? error.stack : undefined;

  await log({
    type,
    level: LogLevel.ERROR,
    message,
    meta: { ...meta, stack },
    userId,
  });
}

export async function logInfo(
  type: LogType,
  message: string,
  meta?: Record<string, unknown>,
  userId?: string
): Promise<void> {
  await log({
    type,
    level: LogLevel.INFO,
    message,
    meta,
    userId,
  });
}

export async function logWarn(
  type: LogType,
  message: string,
  meta?: Record<string, unknown>,
  userId?: string
): Promise<void> {
  await log({
    type,
    level: LogLevel.WARN,
    message,
    meta,
    userId,
  });
}

// Get recent logs for admin dashboard
export async function getRecentLogs(options: {
  type?: LogType;
  level?: LogLevel;
  limit?: number;
  offset?: number;
}) {
  const { type, level, limit = 100, offset = 0 } = options;

  const where: Record<string, unknown> = {};
  if (type) where.type = type;
  if (level) where.level = level;

  const [logs, total] = await Promise.all([
    prisma.systemLog.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: limit,
      skip: offset,
    }),
    prisma.systemLog.count({ where }),
  ]);

  return { logs, total };
}

// Clean up old logs
export async function cleanupOldLogs(daysToKeep: number = 30): Promise<number> {
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);

  const result = await prisma.systemLog.deleteMany({
    where: {
      createdAt: { lt: cutoffDate },
    },
  });

  return result.count;
}

// Convenience logger object for compatibility
export const logger = {
  info: logInfo,
  error: logError,
  warn: logWarn,
  log,
};
