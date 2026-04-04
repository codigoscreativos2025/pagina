class MessageQueue {
  constructor(redis, debounceTime = 3000) {
    this.redis = redis
    this.debounceTime = debounceTime
    this.queuePrefix = 'wa:queue:'
    this.timers = new Map()
  }

  async addMessage(phoneNumber, message) {
    const queueKey = `${this.queuePrefix}${phoneNumber}`
    const existingQueue = await this.redis.get(queueKey)

    if (existingQueue) {
      const updatedQueue = existingQueue + '\n' + message
      await this.redis.setEx(queueKey, Math.ceil(this.debounceTime / 1000), updatedQueue)
    } else {
      await this.redis.setEx(queueKey, Math.ceil(this.debounceTime / 1000), message)
      this.scheduleFlush(phoneNumber)
    }

    return { queued: true, phoneNumber }
  }

  scheduleFlush(phoneNumber) {
    if (this.timers.has(phoneNumber)) {
      clearTimeout(this.timers.get(phoneNumber))
    }

    const timer = setTimeout(async () => {
      const queueKey = `${this.queuePrefix}${phoneNumber}`
      const finalMessage = await this.redis.get(queueKey)
      
      if (finalMessage) {
        await this.redis.del(queueKey)
        this.onFlush(phoneNumber, finalMessage)
      }
      
      this.timers.delete(phoneNumber)
    }, this.debounceTime)

    this.timers.set(phoneNumber, timer)
  }

  onFlush(phoneNumber, message) {
    console.log(`[Queue] Flushing ${phoneNumber}: "${message.substring(0, 50)}..."`)
  }

  async getQueueStatus(phoneNumber) {
    const queueKey = `${this.queuePrefix}${phoneNumber}`
    const messages = await this.redis.get(queueKey)
    return { phoneNumber, queued: !!messages, message: messages }
  }

  async clearQueue(phoneNumber) {
    const queueKey = `${this.queuePrefix}${phoneNumber}`
    await this.redis.del(queueKey)
    if (this.timers.has(phoneNumber)) {
      clearTimeout(this.timers.get(phoneNumber))
      this.timers.delete(phoneNumber)
    }
  }
}

module.exports = MessageQueue
