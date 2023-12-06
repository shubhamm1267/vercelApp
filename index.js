const express = require('express');
const { exec } = require('youtube-dl-exec');
const fetch = import('node-fetch');
const app = express();
const cors = require('cors');
const port = process.env.PORT | 3001;


app.use(express.json());
app.use(cors());

//youtube downloader code below
app.get('/youtube/video-formats', async (req, res) => {
    let { videoId } = req.query;

    if (videoId.includes('youtu.be')) {
        const url = new URL(videoId);
        videoId = url.pathname.substr(1);
    } else if (videoId.includes('youtube.com')) {
        const url = new URL(videoId);
        videoId = url.searchParams.get('v');
    }

    try {
        // Execute youtube-dl command to fetch video details
        const { stdout } = await exec(['-J', `https://www.youtube.com/watch?v=${videoId}`]);

        const jsonData = JSON.parse(stdout);

        // List of preferred resolutions
        const preferredResolutions = ['144p', '240p', '360p', '480p', '720p', '1080p', '1440p', '2160p'];

        const videoAudioFormats = jsonData.formats
            .filter(format => preferredResolutions.includes(format.format_note))
            .map(format => {
                return {
                    itag: format.format_id,
                    quality: format.format,
                    container: format.ext,
                    sizeInBytes: format.filesize || null
                };
            });

        res.status(200).json(videoAudioFormats);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Unable to fetch video formats.' });
    }
});


  const videoCache = {};

  app.get('/youtube/download', async (req, res) => {
    try {
      const { videoId, quality } = req.query;
      const format = quality || 'best';
  
      // Check cache for video details, fetch if not available
      let videoTitle = videoCache[videoId]?.title;
  
      if (!videoTitle) {
        const { stdout } = await exec(['-e', '--get-title', `https://www.youtube.com/watch?v=${videoId}`]);
        videoTitle = stdout.trim();
        videoCache[videoId] = { title: videoTitle };
      }
  
      res.setHeader('Content-Disposition', `attachment; filename="y7mate.com -${videoTitle}.mp4"`);
      res.setHeader('Content-Type', 'video/mp4');
  
      const videoStream = exec(['-f', format, '-o', '-', `https://www.youtube.com/watch?v=${videoId}`]);
  
      videoStream.on('error', (err) => {
        console.error('Error streaming video:', err);
        res.status(500).json({ error: 'Internal Server Error' });
      });
  
      videoStream.stdout.on('data', (chunk) => {
        // Stream smaller chunks of data
        res.write(chunk);
      });
  
      videoStream.stdout.on('end', () => {
        res.end();
        console.log('Streaming finished');
      });
    } catch (error) {
      console.error('Error downloading video:', error);
      res.status(500).json({ error: 'Internal Server Error' });
    }
  });

//instagram video downloader code below  


// Express API for Instagram video formats
app.get('/instagram/video-formats', async (req, res) => {
    const { videoId } = req.query; // Assuming videoId is passed as a parameter
  
    try {
      // Execute youtube-dl command to fetch Instagram video details
      const { stdout } = await exec(['-J', `https://www.instagram.com/p/${videoId}`]);
  
      const jsonData = JSON.parse(stdout);
  
      // Extract video formats and other relevant details
      // Modify the logic here to parse the output of youtube-dl for Instagram video formats
      const videoFormats = jsonData.formats.map(format => {
        return {
          itag: format.format_id,
          quality: format.format,
          container: format.ext,
          sizeInBytes: format.filesize || null
          // Add more properties if needed
        };
      });
  
      res.status(200).json(videoFormats);
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: 'Unable to fetch video formats.' });
    }
  });

  
  // Express API for downloading Instagram videos
app.get('/instagram/download', async (req, res) => {
    try {
      const { videoUrl, quality } = req.query; // Assuming videoUrl and quality are passed as parameters
      const format = quality || 'best'; // Set default format if quality is not provided
  
      // Check cache for video details, fetch if not available
      let videoTitle = videoCache[videoUrl]?.title;
  
      if (!videoTitle) {
        const { stdout } = await exec(['-e', '--get-title', videoUrl]);
        videoTitle = stdout.trim();
        videoCache[videoUrl] = { title: videoTitle };
      }
  
      res.setHeader('Content-Disposition', `attachment; filename="instagram-${videoTitle}.mp4"`);
      res.setHeader('Content-Type', 'video/mp4');
  
      const videoStream = exec(['-f', format, '-o', '-', videoUrl]);
  
      videoStream.on('error', (err) => {
        console.error('Error streaming video:', err);
        res.status(500).json({ error: 'Internal Server Error' });
      });
  
      videoStream.stdout.on('data', (chunk) => {
        // Stream smaller chunks of data
        res.write(chunk);
      });
  
      videoStream.stdout.on('end', () => {
        res.end();
        console.log('Streaming finished');
      });
    } catch (error) {
      console.error('Error downloading video:', error);
      res.status(500).json({ error: 'Internal Server Error' });
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