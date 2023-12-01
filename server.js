const express = require('express');
const fetch = import('node-fetch');
const app = express();
const cors = require('cors');
const port = 3001;

app.use(express.json());
app.use(cors());

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
