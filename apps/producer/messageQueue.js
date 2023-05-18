const amqp = require('amqplib/callback_api');
const uuid = require('uuid');
const { EventEmitter } = require('events');

let channel = null;
const queue = 'hello';
const queueReply = 'amq.rabbitmq.reply-to';
let responseEmitter = null;
amqp.connect({
    hostname: 'localhost',
    username: 'duytung95nb',
    password: '123456',
    port: '5673'
}, function(error0, connection) {
  if (error0) {
    console.log('Error connecting', error0);
    throw error0;
  }
  connection.createConfirmChannel(function(error1, confirmChannel) {
    channel = confirmChannel;
    if (error1) {
      throw error1;
    }

    confirmChannel.assertQueue(queue, {
      durable: false
    });
    confirmChannel.assertQueue(queueReply, {
      durable: false
    });

    // Reply queue
    if(!responseEmitter) {
        responseEmitter = new EventEmitter();
        responseEmitter.setMaxListeners(0);
    }
    channel.consume(
        queueReply,
        msg => {
            console.log('Message processed successfully with correlationId and content',
                msg.properties.correlationId,
                msg.content.toString('utf-8'));
            responseEmitter.emit(
                msg.properties.correlationId,
                msg.content.toString('utf-8')
            );
        },
        { noAck: true },
    );
  });
});

async function sendRpcMessage(msg) {
    const correlationId = uuid.v4();
    return new Promise((resolve, reject) => {
        const messageReplyHandler = (result) => {
            console.log('Resolved message', correlationId, result);
            responseEmitter.removeAllListeners(correlationId);
            resolve(result);
        };
        responseEmitter.once(correlationId, messageReplyHandler);
        console.log('Listener count and event names of correlationId',
            responseEmitter.listenerCount(correlationId),
            correlationId,
            responseEmitter.eventNames()
        );
        console.log(" [x] Sent with correlationId %s", correlationId);
    
        channel.sendToQueue(queue, Buffer.from(msg), {
            replyTo: queueReply,
            correlationId,
            expiration: 30000
        });
        console.log(" [x] Sent %s", msg);

        setTimeout(() => {
            const isResolved = responseEmitter.listenerCount(correlationId) === 0;
            if(!isResolved) {
                responseEmitter.off(correlationId, messageReplyHandler);
                console.error('Process message timeout',
                    correlationId,
                    2000);
                reject();
            }
        }, 2000);
    })
}

module.exports = sendRpcMessage