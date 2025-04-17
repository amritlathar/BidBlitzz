import { server } from './app.js';
import './db/index.js';  // This will execute the connection test

const PORT = process.env.PORT || 5000;

// Start server
server.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});


