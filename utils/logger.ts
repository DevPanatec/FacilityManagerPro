import winston from 'winston'

const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  defaultMeta: { service: 'facility-manager' },
  transports: [
    // Escribir todos los logs con nivel 'error' o menor a 'error.log'
    new winston.transports.File({ filename: 'logs/error.log', level: 'error' }),
    // Escribir todos los logs con nivel 'info' o menor a 'combined.log'
    new winston.transports.File({ filename: 'logs/combined.log' })
  ]
})

// Si no estamos en producción, también log a la consola
if (process.env.NODE_ENV !== 'production') {
  logger.add(new winston.transports.Console({
    format: winston.format.combine(
      winston.format.colorize(),
      winston.format.simple()
    )
  }))
}

export default logger 