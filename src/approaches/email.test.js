const { EmailProvider, EmailFallbackProvider, EmailRetryingProvider } = require('./email/providers')
const bunyan = require('bunyan')
const log = bunyan.createLogger(
  {
    name: "css",
    src: true,
    level: 'trace',
    serializers: bunyan.stdSerializers
  }
)

describe('email approach', () => {

  describe('EmailProvider', () => {

    afterAll(() => {
      return jest.clearAllTimers()
    })
    
    jest.useFakeTimers()

    let mockTranspoter = { sendMail: jest.fn() }
    let ep = new EmailProvider('test', mockTranspoter, true, log)

    it('normal sending', async () => {
      mockTranspoter.sendMail.mockReturnValueOnce(new Promise((res, rej) => res({})))
      await ep.send('', '', '', '')
      expect(ep.errorNumPerMinute).toBe(0)
    })

    it('error count increacing', async () => {
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

  describe('EmailFallbackProvider', () => {})

  describe('EmailRetryingProvider', () => {})

})