const router = require('express').Router()
const db = require('../../db')

router.get('/:email/count', async (req, res) => {
  let userEmailAddress = req.params.email
  let timePeriod = req.query.start && req.query.end ?
    { start: new Date(req.query.start), end: new Date(req.query.end) } : null

  let count = await db.notifyingLog.countNotifyingByEmail(userEmailAddress, timePeriod)

  res.send({
    count: count,
    timePeriod: timePeriod
  })
})

module.exports = router