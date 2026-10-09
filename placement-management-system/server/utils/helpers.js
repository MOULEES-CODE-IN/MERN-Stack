const escapeRegex = (s = "") => String(s).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const httpError = (status, message) => {
  const err = new Error(message);
  err.status = status;
  return err;
};

const toList = (v) =>
  Array.isArray(v) ? v.map((s) => String(s).trim()).filter(Boolean) : String(v || "").split(",").map((s) => s.trim()).filter(Boolean);

module.exports = { escapeRegex, httpError, toList };
