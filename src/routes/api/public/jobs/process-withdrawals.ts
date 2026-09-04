import { createFileRoute } from '@tanstack/react-router';

/**
 * Background withdrawal payout worker.
 *
 * Call with:  POST /api/public/jobs/process-withdrawals
 *             Authorization: Bearer <LOVABLE_CRON_SECRET>
 */
export const Route = createFileRoute('/api/public/jobs/process-withdrawals')({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const secret = process.env['LOVABLE_CRON_SECRET'];
        if (!secret) return new Response('Job secret not configured', { status: 503 });

        const header = request.headers.get('authorization') ?? '';
        const provided = header.startsWith('Bearer ') ? header.slice(7) : request.headers.get('x-cron-secret') ?? '';
        if (provided.length !== secret.length || provided !== secret) {
          return new Response('Unauthorized', { status: 401 });
        }

        const { drainWithdrawalQueue } = await import('@/lib/withdrawal-queue.server');
        const result = await drainWithdrawalQueue(10);
        return Response.json(result, { status: result.ok ? 200 : 202 });
      },
    },
  },
});
