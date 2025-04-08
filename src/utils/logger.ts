import pino from "pino";

// Create a pino logger instance with minimal configuration
const logger = pino({
  transport: {
    target: "pino-pretty",
    options: {
      colorize: true,
    },
  },
  level: "info", // Set the logging level to 'info' to only log info messages
  base: undefined, // Disable additional logging context (timestamp, pid, hostname)
});

export default logger;
