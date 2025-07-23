export default {
  port: Number(process.env.PORT) || 3000,
  pingInterval: Number(process.env.PING_INTERVAL) || 5000,
  pingMaxRetries: Number(process.env.PING_MAX_RETRIES) || 3,
  monitorPath: process.env.MONITOR_PATH || '/colyseus'
};
