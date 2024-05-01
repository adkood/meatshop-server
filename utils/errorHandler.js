const errorHandler = (err, req, res, next) => {
    console.log("Error :", err);

    const statusCode = err.statusCode || 500;
    const errorResponse = {
        error: {
            type: err.name || "InternalServerError",
            message: err.message || "Something went wrong",
            stack: process.env.NODE_ENV === 'production' ? undefined : err.stack
        }
    }
    res.status(statusCode).json(errorResponse);
}

module.exports = errorHandler;