import express from 'express';
import cors from 'cors';
import multer from 'multer';
import { runPipeline } from './orchestrator.ts';
import { store } from './store.ts';

const app = express();
app.use(cors());

const upload = multer({ storage: multer.memoryStorage() });

app.post('/upload-guidelines', upload.single('file'), (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }
    
    store.activeGuidelineFile = {
      data: req.file.buffer.toString('base64'),
      mimeType: req.file.mimetype || 'application/pdf'
    };
    
    res.json({ status: 'success' });
  } catch (error) {
    console.error('Error uploading guidelines:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.post('/process-video', upload.single('video'), async (req, res) => {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');

  const mockMode = req.body.mock_mode === 'true';
  const file = req.file;

  const onEvent = (msg: any) => {
    res.write(`data: ${JSON.stringify(msg)}\n\n`);
    if (msg.status === 'finished' || msg.status === 'error') {
      res.end();
    }
  };

  if (!file && !mockMode) {
    onEvent({ agent: 'System', status: 'error', message: 'No video file provided.' });
    return;
  }

  await runPipeline(file, mockMode, onEvent);
});

const PORT = process.env.PORT || 8000;
app.listen(PORT, () => {
  console.log(`Veloce.AI Backend running on port ${PORT}`);
});
