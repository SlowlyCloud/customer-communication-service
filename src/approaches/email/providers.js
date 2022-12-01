
class EmailProvider {
  constructor(id, transporter, isDefault, log) {
    this.id = id
    this.t = transporter
    this.isDefault = isDefault || false
    this.log = log
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
    this.log.trace('email sending %s by transporter %s', reqStr, this.id)

    try {

      let res = await this.t.sendMail(req)
      this.log.trace('email sent %s by transporter %s', JSON.stringify(res), this.t.name)
      return res

    } catch (error) {

      this.log.error('error at sending email by transporter %s, err: %s, req: %s',
        this.id, JSON.stringify(error), reqStr)

      this.errorNumPerMinute++
      throw new Error(error)

    }


  }
}

class EmailFallbackProvider {
  /**
   * Create a EmailFallback Provider by providing a set of provider for fallback usage
   * @param {number} unavailableThreshold number of error count to set a provider unavailable
   * @param {number} fallbackWindow number of second for a period stopping using defalut provider during the fallback
   * @param {Array<EmailProvider>} providers providers to fallback at least and only inculding one defualt provider 
   */
  constructor(unavailableThreshold, fallbackWindow, providers) {
    if (providers.length < 2)
      throw new Error('you need at least two providers to create a email provider with fallback')

    this.isFallback = false
    this.threshold = unavailableThreshold || 5
    this.fallbackWindow = (fallbackWindow || 60) * 1000
    this.providers = providers.filter(v => !v.isDefault)
    let _default = providers.filter(v => v.isDefault)
    this.default = _default[0]

    if (_default.length !== 1)
      throw new Error('providers should include one and only one defualt provider')
  }

  send = async (from, to, subject, content) => {

    let provider = this._isAvailable(this.default) ?
      this.default : this.providers.find(v => this._isAvailable(v))

    if (!provider)
      throw new Error(`no any fallback provider of ${this.providers.length + 1} providers is available`)

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
    if (provider.errorNumPerMinute < this.threshold)
      return true
    else
      return false
  }

  tryFallback = (defaultProvider) => {
    if (defaultProvider.errorNumPerMinute < this.threshold) return

    this.isFallback = true
    setTimeout(() => this.isFallback = false, this.fallbackWindow)
  }
}

class EmailRetryingProvider {
  constructor(retryCount, provider, log) {
    this.retryCount = retryCount || 3
    this.provider = provider
    this.log = log
  }

  send = async (from, to, subject, content) => {
    let errors = []
    for (const _ of Array(this.retryCount)) {
      try {

        let res = await this.provider.send(from, to, subject, content)

        if (errors.length !== 0) {
          this.log.debug('email sent successfully with %s retry, errors: %s',
            errors.length,
            JSON.stringify(errors.map(v => JSON.stringify(v, Object.getOwnPropertyNames(v))))
          )

          this.log.trace('email sent successfully with %s retry, errors: %s, content: %s',
            errors.length,
            JSON.stringify(errors.map(v => JSON.stringify(v, Object.getOwnPropertyNames(v)))),
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

module.exports = {
  EmailProvider,
  EmailFallbackProvider,
  EmailRetryingProvider
}