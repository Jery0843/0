import { redis } from '@/lib/redis';

export async function GET(request: Request) {
  const url = new URL(request.url);
  const chatType = url.searchParams.get('type') || 'sudo';
  
  const stream = new ReadableStream({
    async start(controller) {
      const encoder = new TextEncoder();
      const send = (data: any) => {
        controller.enqueue(encoder.encode(`data: ${JSON.stringify(data)}\n\n`));
      };

      const channel = `chat:${chatType}`;
      let lastCheck = Date.now() - 5000;

      send({ type: 'connected' });
      console.log(`Chat stream connected: ${chatType}`);

      const interval = setInterval(async () => {
        try {
          const messages: any[] = await redis.lrange(`${channel}:messages`, 0, 4);
          
          const newMessages = messages
            .map((m: any) => typeof m === 'string' ? JSON.parse(m) : m)
            .filter((m: any) => {
              const msgTime = m.timestamp || new Date(m.created_at).getTime();
              return msgTime > lastCheck;
            });
          
          if (newMessages.length > 0) {
            send({ type: 'update', messages: newMessages });
            lastCheck = Date.now();
          }
        } catch (error) {
          console.error('SSE error:', error);
        }
      }, 2000);

      const cleanup = () => {
        clearInterval(interval);
        try {
          controller.close();
        } catch (e) {
          // Controller already closed
        }
      };

      request.signal?.addEventListener('abort', cleanup);
      setTimeout(cleanup, 300000); // 5 min timeout
    }
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
    },
  });
}
