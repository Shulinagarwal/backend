const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');

const { searchYouTube } = require('./utils/youtube');
const { searchGoogle } = require('./utils/googleSearch');


dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

const normalize = (value, max) => (max ? value / max : 0);

/**
 * GET /search?q=your+search+term
 * Returns aggregated and ranked search results from YouTube, Articles, and Academic Papers.
 */
app.get('/search', async (req, res) => {
  const query = req.query.q;

  if (!query) {
    return res.status(400).json({ error: 'No search query provided.' });
  }

  try {
    // Fetch data from APIs in parallel
    const [youtubeResults, articleResults, paperResults] = await Promise.all([
      searchYouTube(query, 8),
      searchGoogle(query,8),
      searchGoogle(query, 8)
    ]);

    const maxViews = Math.max(...youtubeResults.map(v => v.viewCount), 1);
    const maxLikes = Math.max(...youtubeResults.map(v => v.likeCount), 1);
    const maxCitations = Math.max(...paperResults.map(p => p.citationCount), 1);

    
    // Log the results to check if they're being fetched correctly
    console.log('YouTube Results:', JSON.stringify(youtubeResults, null, 2));
    console.log('Article Results:', JSON.stringify(articleResults, null, 2));
    console.log('Paper Results:', JSON.stringify(paperResults, null, 2));

    // Process YouTube results
    const processedYouTube = youtubeResults.map(video => {
        const popularity = normalize(video.viewCount, maxViews) + normalize(video.likeCount, maxLikes);
        const engagement = normalize(video.likeCount, maxLikes);
        const score = (video.relevance * 0.5) + (popularity * 0.3) + (engagement * 0.2);
        
      return {
        type: 'YouTube',
        title: video.title,
        url: video.url,
        score: parseFloat(score.toFixed(4))
       };
    });

    // Process Article results
    const processedArticles = articleResults.map(article => {
        const score = article.relevance * 0.7;
      return {
        type: 'Article',
        title: article.title,
        url: article.url,
        snippet: article.snippet,
        score: parseFloat(score.toFixed(4))
      };
    });

    // Process Academic Papers
    const processedPapers = paperResults.map(paper => {     
        const popularity = normalize(paper.citationCount, maxCitations);
        const score = (paper.relevance * 0.5) + (popularity * 0.5);
  
        return {
        type: 'Academic Paper',
        title: paper.title,
        url: paper.url,
        citationCount: paper.citationCount,
       score: parseFloat(score.toFixed(4))  
      };
    });

    // Aggregate all results
    const allResults = [...processedYouTube, ...processedArticles, ...processedPapers];

    // Sort results based on score in descending order
    allResults.sort((a, b) => b.score - a.score);

    res.json({ results: allResults });
  } catch (error) {
    console.error('Error processing search:', error.message);
    res.status(500).json({ error: 'An error occurred while processing the search.' });
  }
});

// Root endpoint
app.get('/', (req, res) => {
  res.send('Welcome to the Multi-Source Search API. Use /search?q=your+query to search.');
});

// Start the server
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
