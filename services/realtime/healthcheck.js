const HEALTH_URL = "http://127.0.0.1:8787/health";
const EXIT_OK = 0;
const EXIT_FAILURE = 1;

fetch(HEALTH_URL)
  .then((response) => {
    process.exit(response.ok ? EXIT_OK : EXIT_FAILURE);
  })
  .catch(() => {
    process.exit(EXIT_FAILURE);
  });
