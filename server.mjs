import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(fileURLToPath(new URL('.', import.meta.url)));
const appRoot = resolve(root, 'app');
const port = Number(process.env.PORT ?? 4173);

/** Sends a JSON response with the appropriate content type. */
function sendJson(response, statusCode, data) {
  response.writeHead(statusCode, { 'Content-Type': 'application/json' });
  response.end(JSON.stringify(data));
}

/** Serves the local dashboard and a deterministic synthetic summary service. */
const server = createServer(async (request, response) => {
  const url = new URL(request.url ?? '/', `http://${request.headers.host}`);
  if (url.pathname === '/api/generate' && request.method === 'POST') {
    let body = '';
    for await (const chunk of request) {
      body += chunk;
    }

    let payload;
    try {
      payload = JSON.parse(body);
    } catch {
      sendJson(response, 400, { error: 'invalid_request' });
      return;
    }
    if (payload.ticketId !== 'T-100' || !Array.isArray(payload.messages)) {
      sendJson(response, 400, { error: 'invalid_ticket' });
      return;
    }
    sendJson(response, 200, {
      status: 'ok',
      summary: 'The customer reports a delayed package and requests a delivery update.',
      sourceIds: ['m1'],
    });
    return;
  }

  const requestedPath = url.pathname === '/' ? '/index.html' : url.pathname;
  const filePath = resolve(appRoot, `.${requestedPath}`);
  if (!filePath.startsWith(`${appRoot}${sep}`)) {
    response.writeHead(403);
    response.end('Forbidden');
    return;
  }

  try {
    const content = await readFile(filePath);
    response.writeHead(200, {
      'Content-Type': filePath.endsWith('.html')
        ? 'text/html; charset=utf-8'
        : filePath.endsWith('.js')
          ? 'text/javascript; charset=utf-8'
          : 'application/octet-stream',
    });
    response.end(content);
  } catch {
    response.writeHead(404);
    response.end('Not found');
  }
});

server.listen(port, '127.0.0.1', () => {
  console.log(`Support dashboard listening on http://127.0.0.1:${port}`);
});
