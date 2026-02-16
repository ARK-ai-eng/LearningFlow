import { NOT_ADMIN_ERR_MSG, UNAUTHED_ERR_MSG } from '@shared/const';
import { initTRPC, TRPCError } from "@trpc/server";
import superjson from "superjson";
import type { TrpcContext } from "./context";
import { perfLogger } from "../performance-logger";
import { dbTracker } from "../db-performance";

const t = initTRPC.context<TrpcContext>().create({
  transformer: superjson,
});

// Performance-Logging-Middleware
const performanceMiddleware = t.middleware(async ({ path, type, next }) => {
  const startTime = process.hrtime.bigint();
  dbTracker.reset();
  
  const result = await next();
  
  const endTime = process.hrtime.bigint();
  const totalMs = Number(endTime - startTime) / 1_000_000;
  const { queryCount, totalDbTime, maxSingleQueryMs } = dbTracker.getStats();
  
  perfLogger.log(`${type}.${path}`, totalMs, totalDbTime, queryCount, maxSingleQueryMs);
  
  return result;
});

export const router = t.router;
export const publicProcedure = t.procedure.use(performanceMiddleware);

const requireUser = t.middleware(async opts => {
  const { ctx, next } = opts;

  if (!ctx.user) {
    throw new TRPCError({ code: "UNAUTHORIZED", message: UNAUTHED_ERR_MSG });
  }

  return next({
    ctx: {
      ...ctx,
      user: ctx.user,
    },
  });
});

export const protectedProcedure = t.procedure.use(requireUser);

export const adminProcedure = t.procedure.use(
  t.middleware(async opts => {
    const { ctx, next } = opts;

    if (!ctx.user || ctx.user.role !== 'sysadmin') {
      throw new TRPCError({ code: "FORBIDDEN", message: NOT_ADMIN_ERR_MSG });
    }

    return next({
      ctx: {
        ...ctx,
        user: ctx.user,
      },
    });
  }),
);
