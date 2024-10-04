const axios = require('axios');
require('dotenv').config();

const YOUTUBE_API_KEY = process.env.YOUTUBE_API_KEY;
const searchYouTube = async (query, maxResults = 5) => {
  try {
    const searchResponse = await axios.get('https://www.googleapis.com/youtube/v3/search', {
      params: {
        part: 'snippet',
        q: query,
        type: 'video',
        maxResults,
        key: YOUTUBE_API_KEY
      }
    });

    console.log('YouTube Search Response:', JSON.stringify(searchResponse.data, null, 2));

    const videoIds = searchResponse.data.items.map(item => item.id.videoId).join(',');

    if (!videoIds) {
      console.warn('No video IDs returned from search.');
      return [];
    }

    // Step 2: Get video statistics
    const statsResponse = await axios.get('https://www.googleapis.com/youtube/v3/videos', {
      params: {
        part: 'statistics',
        id: videoIds,
        key: YOUTUBE_API_KEY
      }
    });

    console.log('YouTube Stats Response:', JSON.stringify(statsResponse.data, null, 2));

    const statsMap = {};
    statsResponse.data.items.forEach(item => {
      statsMap[item.id] = item.statistics;
    });

    // Step 3: Combine data
    const videos = searchResponse.data.items.map(item => {
      const stats = statsMap[item.id.videoId] || {};
      return {
        title: item.snippet.title,
        url: `https://www.youtube.com/watch?v=${item.id.videoId}`,
        viewCount: parseInt(stats.viewCount) || 0,
        likeCount: parseInt(stats.likeCount) || 0,
        relevance: 1 // Placeholder for relevance; can be enhanced
      };
    });

    return videos;
  } catch (error) {
    console.error('Error fetching YouTube data:', error.message);
    return [];
  }
};

module.exports = { searchYouTube };
