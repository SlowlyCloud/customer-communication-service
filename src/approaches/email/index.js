const log = require('../../logging')
const config = require('../../config')
const emailer = require('nodemailer')
const { EmailProvider, EmailFallbackProvider, EmailRetryingProvider } = require('./providers')


// Config
let _conf = {
  providers: config.emailServers.providers,
  unavailableThreshold: config.emailServers.unavailableThreshold || 10,
  fallbackWindow: (config.emailServers.fallbackWindow || 60) * 1000,
  retryCount: config.emailServers.retryCount || 3,
}

const _transporters = _conf.providers.map(v => {
  return new EmailProvider(
    v.id,
    emailer.createTransport({
      host: v.host,
      secure: true,
      auth: {
        user: v.user,
        pass: v.pass
      }
    }),
    v.isDefault,
    log
  )
})

const _default = _transporters.filter(v => v.isDefault)[0]
const _triedFallbackProvder = new EmailRetryingProvider(
  _conf.retryCount,
  new EmailFallbackProvider(
    _conf.unavailableThreshold,
    _conf.fallbackWindow,
    _transporters
  ),
  log
)

log.trace('email transport created', JSON.stringify(_conf))

module.exports = {
  EmailProvider,
  EmailFallbackProvider,
  EmailRetryingProvider,
  send: _default.send,
  trySendWithFallback: _triedFallbackProvder.send
}