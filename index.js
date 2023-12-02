const express = require('express');
const ytdl = require('ytdl-core');
const fetch = import('node-fetch');
const app = express();
const cors = require('cors');
const port = process.env.PORT | 3001;

app.use(express.json());
app.use(cors());

app.get('/youtube/video-formats', async (req, res) => {
  const { videoId } = req.query;

  try {
    const info = await ytdl.getInfo(videoId);
    const formats = info.formats.map((format) => ({
      itag: format.itag,
      quality: format.qualityLabel,
      container: format.container,
      type: format.mimeType,
      sizeInBytes: format.contentLength || null
    }));
    
    res.json(formats);
  } catch (error) {
    console.error('Error fetching video formats:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

app.get('/youtube/download', async (req, res) => {
  const { videoId, quality } = req.query;

  try {
    const videoInfo = await ytdl.getInfo(`https://www.youtube.com/watch?v=${videoId}`);
    if (!videoInfo) {
      console.error('Video information not found');
      res.status(404).send('Video information not found');
      return;
    }

    const selectedFormat = ytdl.chooseFormat(videoInfo.formats, { quality });

    if (selectedFormat) {
      const videoStream = ytdl(`https://www.youtube.com/watch?v=${videoId}`, { format: selectedFormat });

      const sanitizedTitle = videoInfo.videoDetails.title.replace(/[^a-z0-9]/gi, '_');
      res.setHeader('Content-Disposition', `attachment; filename="${sanitizedTitle}.mp4"`);

      videoStream.pipe(res);
    } else {
      console.error('Requested video quality not found');
      res.status(404).send('Requested video quality not found');
    }
  } catch (error) {
    console.error('Error downloading video:', error);
    res.status(500).json({ error: 'Internal Server Error', message: error.message });
  }
});


app.get('/youtube/thumbnail', async (req, res) => {
    const { videoId, quality } = req.query;
  
    try {
      const fetchModule = await fetch;
      const response = await fetchModule.default(`https://i3.ytimg.com/vi/${videoId}/${quality}.jpg`);
      const arrayBuffer = await response.arrayBuffer();
  
      const buffer = Buffer.from(arrayBuffer);
  
      res.writeHead(200, {
        'Content-Type': 'image/jpeg',
        'Content-Length': buffer.length,
      });
      res.end(buffer);
    } catch (error) {
      console.error('Error fetching thumbnail:', error);
      res.status(500).json({ error: 'Internal Server Error' });
    }
  });



app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});