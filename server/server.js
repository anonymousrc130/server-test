import express from 'express';
const app = express();

// Middleware
app.use(express.json());

// Example route
app.get('/api/test', (req, res) => {
  res.send('Hello from the API!');
});

// Start the server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

export default app;
