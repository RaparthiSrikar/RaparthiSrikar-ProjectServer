const express = require('express');
const axios = require('axios');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3004;

let jsonData = null;

// Function to fetch data
const fetchData = async () => {
  try {
    // Fetch data from a URL
    const response = await axios.get('https://s3.amazonaws.com/roxiler.com/product_transaction.json');
    
    // Store the fetched data in jsonData
    jsonData = response.data;
    
    // Log the fetched data in the console
    console.log('Data:', jsonData);
  } catch (error) {
    console.error('Error fetching data:', error.message);
  }
};

// Middleware to fetch data on server start
app.use((req, res, next) => {
  if (!jsonData) {
    fetchData().then(() => next());
  } else {
    next();
  }
});

app.use(cors({
  origin: 'http://localhost:3005',
  credentials: true
}));

// Default route handler
app.get('/', (req, res) => {
  res.redirect('/api/data');
});

// /api/data endpoint
app.get('/api/data', (req, res) => {
  res.json(jsonData);
});

// New endpoint to filter data based on parameters
app.get('/api/filter', (req, res) => {
  try {
    let searchMonth = parseInt(req.query.month); // Parse integer from query string

    // If searchMonth is not a valid number or less than 1, set it to -1 to indicate no specific month filter
    if (isNaN(searchMonth) || searchMonth < 1) {
      searchMonth = -1;
    }

    // Filter jsonData based on parameters
    let filteredData = jsonData.filter(item => {
      // Parse the date string and extract the month component
      const dateOfSale = new Date(item.dateOfSale);
      const saleMonth = dateOfSale.getMonth() + 1; // Add 1 because getMonth() returns zero-based index
      
      const monthMatch = searchMonth === -1 || saleMonth === searchMonth;

      return monthMatch;
    });
    if(searchMonth === 0){
      filteredData = jsonData ;
    }
    res.json(filteredData);
  } catch (error) {
    console.error('Error filtering data:', error.message);
    res.status(500).json({ error: 'Failed to filter data' });
  }
});



app.get('/api/stats', (req, res) => {
  try {
    const month = parseInt(req.query.month);
    let totalPrice = 0, soldItems = 0, unSoldItems = 0;

    jsonData.forEach(item => {
      if (new Date(item.dateOfSale).getMonth() + 1 === month || month === 0) {
        totalPrice += parseFloat(item.price);
        if (item.sold) {
          soldItems++;
        } else {
          unSoldItems++;
        }
      }
    });

    res.json({ totalPrice, soldItems, unSoldItems });
  } catch (err) {
    console.error('Error generating stats:', err.message);
    res.status(500).json({ error: 'Failed to generate stats' });
  }
});

app.get('/api/barChart', (req, res) => {
  try {
      const month = parseInt(req.query.month);
      const priceRanges = {
          '0 - 100': 0,
          '101 - 200': 0,
          '201 - 300': 0,
          '301 - 400': 0,
          '401 - 500': 0,
          '501 - 600': 0,
          '601 - 700': 0,
          '701 - 800': 0,
          '801 - 900': 0,
          '901 - above': 0
      };

      // Iterate through jsonData for the selected month
      jsonData.forEach(item => {
          if (new Date(item.dateOfSale).getMonth() + 1 === month || month === 0) {
              const price = parseFloat(item.price);
              if (price >= 0 && price <= 100) {
                  priceRanges['0 - 100']++;
              } else if (price <= 200) {
                  priceRanges['101 - 200']++;
              } else if (price <= 300) {
                  priceRanges['201 - 300']++;
              } else if (price <= 400) {
                  priceRanges['301 - 400']++;
              } else if (price <= 500) {
                  priceRanges['401 - 500']++;
              } else if (price <= 600) {
                  priceRanges['501 - 600']++;
              } else if (price <= 700) {
                  priceRanges['601 - 700']++;
              } else if (price <= 800) {
                  priceRanges['701 - 800']++;
              } else if (price <= 900) {
                  priceRanges['801 - 900']++;
              } else {
                  priceRanges['901 - above']++;
              }
          }
      });

      res.json(priceRanges);
  } catch (err) {
      console.error('Error generating bar chart data:', err.message);
      res.status(500).json({ error: 'Failed to generate bar chart data' });
  }
});

app.get('/api/pieChart', (req, res) => {
  try {
      const month = parseInt(req.query.month);
      const categoryCounts = {};

      // Iterate through jsonData for the selected month
      jsonData.forEach(item => {
          if (new Date(item.dateOfSale).getMonth() + 1 === month || month === 0) {
              const category = item.category;

              // Increment count for the category or initialize it to 1 if it doesn't exist
              categoryCounts[category] = (categoryCounts[category] || 0) + 1;
          }
      });

      res.json(categoryCounts);
  } catch (err) {
      console.error('Error generating pie chart data:', err.message);
      res.status(500).json({ error: 'Failed to generate pie chart data' });
  }
});

app.get('/api/combinedData', (req, res) => {
  const month = parseInt(req.query.month);

  // Fetch data from each API
  const barChartPromise = fetch(`http://localhost:3005/api/barChart?month=${month}`).then(response => response.json());
  const pieChartPromise = fetch(`http://localhost:3005/api/pieChart?month=${month}`).then(response => response.json());
  const statsPromise = fetch(`http://localhost:3005/api/stats?month=${month}`).then(response => response.json());

  // Combine responses when all promises are resolved
  Promise.all([barChartPromise, pieChartPromise, statsPromise])
      .then(([barChartData, pieChartData, statsData]) => {
          res.json({ barChartData, pieChartData, statsData });
      })
      .catch(error => {
          console.error('Error fetching combined data:', error);
          res.status(500).json({ error: 'Failed to fetch combined data' });
      });
});
  
  
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).send('Something broke!');
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
