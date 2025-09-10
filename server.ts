import { createServer } from 'http';
import { parse } from 'url';
import next from 'next';
import { WebSocket, WebSocketServer } from 'ws';
import { startGeminiSession, sendMessageToGemini } from './app/services/geminiServices/modelCall';
import { getCheckpointsArray, buildStepInstruction, CheckpointItem } from './app/prompts/inspector';
import { inspectionChecklist } from './app/utils/inspectionChecklist';

const dev = process.env.NODE_ENV !== 'production';
const hostname = 'localhost';
const port = 3000;

interface InspectionState {
  checkpoints: CheckpointItem[];
  currentIndex: number;
}

const inspectionStates = new Map<WebSocket, InspectionState>();

const app = next({ dev, hostname, port });
const handle = app.getRequestHandler();

app.prepare().then(() => {
  const server = createServer((req, res) => {
    try {
      const parsedUrl = parse(req.url || '/', true);
      handle(req, res, parsedUrl);
    } catch (err) {
      console.error('Error handling request', err);
      res.statusCode = 500;
      res.end('internal server error');
    }
  });

  const wss = new WebSocketServer({ noServer: true });

  server.on('upgrade', (request, socket, head) => {
    const { pathname } = parse(request.url || '');

    if (pathname === '/websocket') {
      wss.handleUpgrade(request, socket, head, (ws) => {
        wss.emit('connection', ws, request);
      });
    } else {
      handle(request, socket, head);
    }
  });

  wss.on('connection', async (ws) => {
    console.log('WebSocket client connected');

    const checkpoints = getCheckpointsArray(inspectionChecklist);
    inspectionStates.set(ws, {
      checkpoints,
      currentIndex: 0,
    });

    let geminiSessionActive = false;

    try {
      await startGeminiSession();
      geminiSessionActive = true;
      ws.send(JSON.stringify({ type: 'status', message: 'Gemini session started' }));

      const currentState = inspectionStates.get(ws)!;
      const currentCheckpoint = currentState.checkpoints[currentState.currentIndex];
      const initialPrompt = buildStepInstruction(currentCheckpoint);

      await sendMessageToGemini(initialPrompt);

      ws.send(JSON.stringify({ type: 'inspectionStep', data: {
        question: currentCheckpoint.question,
        section: currentCheckpoint.section,
        part: currentCheckpoint.part,
      }}));

    } catch (error) {
      console.error('Failed to start Gemini session or send initial prompt:', error);
      ws.send(JSON.stringify({ type: 'error', message: 'Failed to start Gemini session or send initial prompt' }));
      ws.close();
      return;
    }

    ws.on('message', async (message) => {
      console.log('Received message from client:', message.toString());
      if (!geminiSessionActive) {
        ws.send(JSON.stringify({ type: 'error', message: 'Gemini session not active' }));
        return;
      }

      const currentState = inspectionStates.get(ws);
      if (!currentState) {
        ws.send(JSON.stringify({ type: 'error', message: 'Inspection state not found.' }));
        return;
      }

      const userResponse = message.toString();
      const currentCheckpoint = currentState.checkpoints[currentState.currentIndex];

      const promptForGemini = buildStepInstruction(currentCheckpoint);
      const turns = [promptForGemini, userResponse];

      try {
        const geminiResponses = await sendMessageToGemini(turns);
        ws.send(JSON.stringify({ type: 'geminiResponse', data: geminiResponses }));

        currentState.currentIndex++;

        if (currentState.currentIndex < currentState.checkpoints.length) {
          const nextCheckpoint = currentState.checkpoints[currentState.currentIndex];
          const nextPrompt = buildStepInstruction(nextCheckpoint);

          await sendMessageToGemini(nextPrompt);

          ws.send(JSON.stringify({ type: 'inspectionStep', data: {
            question: nextCheckpoint.question,
            section: nextCheckpoint.section,
            part: nextCheckpoint.part,
          }}));
        } else {
          ws.send(JSON.stringify({ type: 'inspectionComplete', message: 'Inspection complete!' }));
        }

      } catch (error) {
        console.error('Error sending message to Gemini or processing inspection step:', error);
        ws.send(JSON.stringify({ type: 'error', message: 'Error communicating with Gemini during inspection.' }));
      }
    });

    ws.on('close', () => {
      console.log('WebSocket client disconnected');
      inspectionStates.delete(ws);
    });

    ws.on('error', (error) => {
      console.error('WebSocket error:', error);
    });
  });

  server.listen(port, (err?: Error) => {
    if (err) throw err;
    console.log(`> Ready on http://${hostname}:${port}`);
  });
});
