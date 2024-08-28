module.exports = (app) => {
  app.use((req, res, next) =>
    res.status(404).json({ message: "404 - Page not found or does not exist." })
  );

  app.use((err, req, res, next) => {
    console.error("ERR: ", req.method, req.path, err);

    if (!res.headersSent) {
      res.status(500).json({
        message: "Internal Server Error, exiting with code 500. Check Console",
      });
    }
  });
};
