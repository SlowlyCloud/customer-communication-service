const log = require('../logging')
const config = require('../config')
const emailer = require('nodemailer')

class EmailProvider {
  constructor(id, transporter, isDefault) {
    this.id = id
    this.t = transporter
    this.isDefault = isDefault
    this.errorNumPerMinute = 0
    setInterval(() => this.errorNumPerMinute = 0, 1000 * 60)
  }

  send = async (from, to, subject, content) => {
    let req = {
      from: from,
      to: to,
      subject: subject,
      html: content
    }

    let reqStr = JSON.stringify(req)
    log.trace('email sending %s by transporter %s', reqStr, this.t.name)

    try {

      let res = await this.t.sendMail(req)
      log.trace('email sent %s by transporter %s', JSON.stringify(res), this.t.name)
      return res

    } catch (error) {

      log.error('error at sending email by transporter %s, err: %s, req: %s',
        this.id, JSON.stringify(error), reqStr)

      this.errorNumPerMinute++
      throw new Error(error)

    }


  }
}

class EmailFallbackProvider {
  /**
   * Create a EmailFallback Provider by providing a set of provider for fallback usage
   * @param {number} unavailableThreshdhold number of error count to set a provider unavailable
   * @param {number} fallbackWindow number of second for a period stopping using defalut provider during the fallback
   * @param {Array<EmailProvider>} providers providers to fallback at least and only inculding one defualt provider 
   */
  constructor(unavailableThreshdhold, fallbackWindow, providers) {
    if (providers.length < 2)
      throw new Error('you need at least two providers to create a email provider with fallback')

    this.isFallback = false
    this.threshdhold = unavailableThreshdhold || 5
    this.fallbackWindow = (fallbackWindow || 60) * 1000
    this.providers = providers.filter(v => !v.isDefault)
    let _default = providers.filter(v => v.isDefault)
    this.default = _default

    if (_default.length !== 1)
      throw new Error('providers should include one and only one defualt provider')
  }

  send = async (from, to, subject, content) => {

    let provider = this._isAvailable(this.default) ?
      this.default : this.providers.find(v => this._isAvailable(v))

    if (!provider)
      throw new Error('no any fallback provider of %s providers is available', this.providers.length + 1)

    try {

      let res = await provider.send(from, to, subject, content)
      return res

    } catch (error) {

      if (provider.isDefault) {
        this.tryFallback(provider)
      }
      throw error

    }
  }

  _isAvailable = (provider) => {
    if (provider.isDefault)
      return !this.isFallback
    if (provider.errorNumPerMinute < this.threshdhold)
      return true
    else
      return false
  }

  tryFallback = (defaultProvider) => {
    if (defaultProvider.errorNumPerMinute < this.threshdhold) return

    this.isFallback = true
    setInterval(() => this.isFallback = false, this.fallbackWindow)
  }
}

class EmailRetryingProvider {
  constructor(retryCount, provider) {
    this.retryCount = retryCount
    this.provider = provider
  }

  send = async (from, to, subject, content) => {
    let errors = []
    for (const _ of this.retryCount) {
      try {

        let res = await this.provider.send(from, to, subject, content)

        if (errors.length !== 0) {
          log.debug('email sent successfully with %s retry, errors: %s',
            errors.length,
            JSON.stringify(errors)
          )

          log.trace('email sent successfully with %s retry, errors: %s, content: %s',
            errors.length,
            JSON.stringify(errors),
            JSON.stringify({
              from: from,
              to: to,
              subject: subject,
              html: content
            })
          )
        }

        return res

      } catch (error) {
        errors.push(error)
      }
    }
    throw errors
  }
}

// Config
let _conf = {
  providers: [
    {
      id: '1',
      host: config.emailServer.host,
      user: config.emailServer.user,
      pass: config.emailServer.pass,
      avaible: true,
      isDefault: true
    }, {
      id: '2',
      host: config.emailServer.host,
      user: config.emailServer.user,
      pass: config.emailServer.pass,
      isDefault: false
    }
  ],
  unavailableThreshdhold: 10,
  fallbackWindow: 60000 * 1,
  isStateFallback: false,
  retryCount: 3,
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
    v.isDefault
  )
})

const _default = _transporters.filter(v => v.isDefault)[0]
const _triedFallbackProvder = new EmailRetryingProvider(
  _conf.retryCount,
  new EmailFallbackProvider(
    _conf.unavailableThreshdhold,
    _conf.fallbackWindow,
    _transporters
  )
)

log.trace('email transport created', emailAuth)

module.exports = {
  send: _default.send,
  trySendWithFallback: _triedFallbackProvder.send
}