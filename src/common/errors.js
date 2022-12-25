
class Errors extends Error {
  constructor(errs) {
    super()
    this.name = 'multiple errors'
    this.errs = errs || []
  }

  get message() {
    return this.toString()
  }

  get length() {
    return this.errs.length
  }

  append = (err) => {
    this.errs.push(err)
  }

  toJSON = () => {
    return {
      message: this.toString(),
      errors: this.errs.map(v => JSON.stringify(v, Object.getOwnPropertyNames(v)))
    }
  }

  toString = () => {
    return this.errs.reduce((m, v) => m = m + `[${v.message}] `, "Errors: ").slice(0, -1)
  }
}

module.exports = {
  Errors
}