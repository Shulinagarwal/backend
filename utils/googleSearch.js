

const axios = require('axios');
require('dotenv').config();

const GOOGLE_API_KEY = process.env.GOOGLE_API_KEY;
const GOOGLE_CSE_ID = process.env.GOOGLE_CSE_ID;

const searchGoogle = async (query, maxResults = 5) => {
  try {
    const response = await axios.get('https://www.googleapis.com/customsearch/v1', {
      params: {
        key: GOOGLE_API_KEY,
        cx: GOOGLE_CSE_ID,
        q: query,
        num: maxResults,
        // You can specify 'siteSearch' or other parameters to focus on blogs or news
      }
    });

    const articles = response.data.items.map(item => ({
      title: item.title,
      url: item.link,
      snippet: item.snippet,
      relevance: 1 // Placeholder for relevance; can be enhanced
    }));

    return articles;
  } catch (error) {
    console.error('Error fetching Google Search data:', error.message);
    return [];
  }
};

module.exports = { searchGoogle };
