const { EmailProvider, EmailFallbackProvider, EmailRetryingProvider } = require('./providers')
const { Errors } = require('../../common/errors')
const bunyan = require('bunyan')
const log = bunyan.createLogger(
  {
    name: "css",
    src: true,
    level: 'trace',
    serializers: bunyan.stdSerializers
  }
)

jest.useFakeTimers()

describe('email approach', () => {

  describe('EmailProvider', () => {

    afterAll(() => {
      return jest.clearAllTimers()
    })

    let mockTranspoter = { sendMail: jest.fn() }
    let ep = new EmailProvider('test', mockTranspoter, true, log)

    it('normal sending', async () => {
      mockTranspoter.sendMail.mockReturnValueOnce(new Promise((res, rej) => res({})))
      await ep.send('', '', '', '')
      expect(ep.errorNumPerMinute).toBe(0)
    })

    it('error count increasing', async () => {
      const err = new Error('give a error for testing')

      try {
        mockTranspoter.sendMail.mockReturnValueOnce(new Promise((res, rej) => rej(err.message)))
        await ep.send('', '', '', '')
      } catch (e) {
        expect(e).toEqual(err)
      }
      expect(ep.errorNumPerMinute).toBe(1)

      try {
        mockTranspoter.sendMail.mockReturnValueOnce(new Promise((res, rej) => rej(err.message)))
        await ep.send('', '', '', '')
      } catch (e) {
        expect(e).toEqual(err)
      }
      expect(ep.errorNumPerMinute).toBe(2)
    })

    it('error count clearing', async () => {
      expect(ep.errorNumPerMinute).toBe(2)
      jest.runOnlyPendingTimers()
      expect(ep.errorNumPerMinute).toBe(0)
    })

  })

  describe('EmailFallbackProvider', () => {

    afterAll(() => {
      return jest.clearAllTimers()
    })

    const newEFP = (threshold, window) => {
      const mockTranspoter1 = { sendMail: jest.fn() }
      const mockTranspoter2 = { sendMail: jest.fn() }
      const eps = [
        new EmailProvider('test-default', mockTranspoter1, true, log),
        new EmailProvider('test-fallback', mockTranspoter2, false, log)
      ]
      return {
        mockTranspoter1,
        mockTranspoter2,
        fbp: new EmailFallbackProvider(threshold, window, eps)
      }
    }

    it('normal sending', async () => {
      const t = newEFP(2, 60)

      t.mockTranspoter1.sendMail.mockReturnValueOnce(new Promise((res, rej) => res('done')))
      expect(await t.fbp.send('', '', '', '')).toBe('done')
    })

    it('throwing error', async () => {
      const t = newEFP(2, 60)
      const testErr = new Error('should failed')

      try {
        t.mockTranspoter1.sendMail.mockReturnValueOnce(
          new Promise((res, rej) => rej(testErr.message)))
        await t.fbp.send('', '', '', '')
      } catch (e) {
        expect(testErr).toEqual(e)
      }
    })

    it('using fallback', async () => {
      const t = newEFP(2, 60)
      const testErr = new Error('should failed')

      try {
        t.mockTranspoter1.sendMail.mockReturnValueOnce(
          new Promise((res, rej) => rej(testErr.message)))
        await t.fbp.send('', '', '', '')
      } catch (e) {
        expect(testErr).toEqual(e)
      }

      try {
        t.mockTranspoter1.sendMail.mockReturnValueOnce(
          new Promise((res, rej) => rej(testErr.message)))
        await t.fbp.send('', '', '', '')
      } catch (e) {
        expect(testErr).toEqual(e)
      }

      t.mockTranspoter2.sendMail.mockReturnValueOnce(
        new Promise((res, rej) => res('done')))
      expect(await t.fbp.send('', '', '', '')).toBe('done')
      expect(t.fbp.isFallback).toBe(true)
      expect(t.fbp.default.errorNumPerMinute).toBe(2)
    })

    it('backing to default when time over the fallback window', async () => {
      const t = newEFP(3, 60)
      const testErr = new Error('should failed')

      for (const _ of Array(3)) {
        try {
          t.mockTranspoter1.sendMail.mockReturnValueOnce(
            new Promise((res, rej) => rej(testErr.message)))
          await t.fbp.send('', '', '', '')
        } catch (e) {
          expect(testErr).toEqual(e)
        }
      }

      expect(t.fbp._isAvailable(t.fbp.default)).toBe(false)

      t.mockTranspoter2.sendMail.mockReturnValueOnce(new Promise((res, rej) => res('successful')))
      expect(await t.fbp.send('', '', '', '')).toBe('successful')

      jest.runOnlyPendingTimers()

      t.mockTranspoter1.sendMail.mockReturnValueOnce(new Promise((res, rej) => res('done')))
      expect(await t.fbp.send('', '', '', '')).toBe('done')

      expect(t.fbp.isFallback).toBe(false)
      expect(t.fbp._isAvailable(t.fbp.default)).toBe(true)
    })

    it('no provider available', async () => {
      const t = newEFP(1, 60)
      const testErr = new Error('should failed')

      try {
        t.mockTranspoter1.sendMail.mockReturnValueOnce(
          new Promise((res, rej) => rej(testErr.message)))
        await t.fbp.send('', '', '', '')
      } catch (e) {
        expect(testErr).toEqual(e)
      }

      try {
        t.mockTranspoter2.sendMail.mockReturnValueOnce(
          new Promise((res, rej) => rej(testErr.message)))
        await t.fbp.send('', '', '', '')
      } catch (e) {
        expect(testErr).toEqual(e)
      }

      try {
        await t.fbp.send('', '', '', '')
      } catch (err) {
        expect(err.message).toBe('no any fallback provider of 2 providers is available')
      }

    })

  })

  describe('EmailRetryingProvider', () => {

    afterAll(() => {
      return jest.clearAllTimers()
    })

    let mockTranspoter = { sendMail: jest.fn() }
    let erp = new EmailRetryingProvider(3, new EmailProvider('test', mockTranspoter, true, log), log)

    it('normal sending', async () => {
      mockTranspoter.sendMail.mockReturnValueOnce(new Promise((res, rej) => res('done')))
      expect(await erp.send('', '', '', '')).toBe('done')
    })

    it('retrying and succeed', async () => {
      const testErr = new Error('should failed')
      mockTranspoter.sendMail.mockReturnValueOnce(
        new Promise((res, rej) => rej(testErr.message)))
      mockTranspoter.sendMail.mockReturnValueOnce(
        new Promise((res, rej) => rej(testErr.message)))
      mockTranspoter.sendMail.mockReturnValueOnce(
        new Promise((res, rej) => res('done')))

      expect(await erp.send('', '', '', '')).toBe('done')
    })

    it('retrying and all failed', async () => {
      const testErr = new Error('should failed')
      mockTranspoter.sendMail.mockReturnValueOnce(
        new Promise((res, rej) => rej(testErr.message)))
      mockTranspoter.sendMail.mockReturnValueOnce(
        new Promise((res, rej) => rej(testErr.message)))
      mockTranspoter.sendMail.mockReturnValueOnce(
        new Promise((res, rej) => rej(testErr.message)))

      try {
        await erp.send('', '', '', '')
      } catch (err) {
        expect(new Errors([testErr, testErr, testErr])).toEqual(err)
      }
    })

  })

  describe('Combining Provider', () => {

    afterAll(() => {
      return jest.clearAllTimers()
    })

    const newCombining = () => {
      const mockTranspoter1 = { sendMail: jest.fn() }
      const mockTranspoter2 = { sendMail: jest.fn() }
      const eps = [
        new EmailProvider('test-default', mockTranspoter1, true, log),
        new EmailProvider('test-fallback', mockTranspoter2, false, log)
      ]
      const fbp = new EmailFallbackProvider(2, 60, eps)
      const erp = new EmailRetryingProvider(3, fbp, log)

      return {
        mockTranspoter1,
        mockTranspoter2,
        eps,
        fbp,
        erp
      }
    }

    it('normal sending', async () => {
      const t = newCombining()
      t.mockTranspoter1.sendMail.mockReturnValueOnce(
        new Promise((res, rej) => res('done')))

      expect(await t.erp.send('', '', '', '')).toBe("done")
    })

    it('sending succeed with default failed once', async () => {
      const t = newCombining()
      const testErr = new Error('should failed')

      t.mockTranspoter1.sendMail.mockReturnValueOnce(
        new Promise((res, rej) => rej(testErr)))
      t.mockTranspoter1.sendMail.mockReturnValueOnce(
        new Promise((res, rej) => res('done')))

      expect(await t.erp.send('', '', '', '')).toBe("done")
    })

    it('sending succeed by fallback with default failed', async () => {
      const t = newCombining()
      const testErr = new Error('should failed')

      t.mockTranspoter1.sendMail.mockReturnValueOnce(
        new Promise((res, rej) => rej(testErr)))
      t.mockTranspoter1.sendMail.mockReturnValueOnce(
        new Promise((res, rej) => rej(testErr)))
      t.mockTranspoter2.sendMail.mockReturnValueOnce(
        new Promise((res, rej) => res('done')))

      expect(await t.erp.send('', '', '', '')).toBe("done")
    })

  })

})