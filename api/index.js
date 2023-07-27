
import init from './app/init.js';
import app from './app/app.js';

try {
  await init();

  const PORT = process.env.PORT || 3200;
  app.listen(PORT, () => {
    console.info(`Server is running on port ${PORT}.`);
  });
} catch (error) {
  console.error('# App error:', error);
}
