module.exports = handleError;

function handleError(err, req, res, next) {
  if (res.headersSent) {
    return next(err)
  }
  res.status(500).send('');
}
