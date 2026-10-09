exports.notFound = (req, res) => res.status(404).json({ message: `Route not found: ${req.method} ${req.originalUrl}` });

// eslint-disable-next-line no-unused-vars
exports.errorHandler = (err, req, res, next) => {
  let status = err.status || 500;
  let message = err.message || "Server error";

  if (err.name === "ValidationError") {
    status = 400;
    message = Object.values(err.errors).map((e) => e.message).join(", ");
  } else if (err.code === 11000) {
    status = 409;
    message = `${Object.keys(err.keyValue || {}).join(", ")} already exists`;
  } else if (err.name === "CastError") {
    status = 400;
    message = "Invalid id or value";
  } else if (err.code === "LIMIT_FILE_SIZE") {
    status = 400;
    message = "File is too large (max 2 MB)";
  }

  if (status === 500) console.error(err);
  res.status(status).json({ message });
};
