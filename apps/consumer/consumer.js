const amqp = require('amqplib/callback_api');

let channel = null;
const queue = 'hello';

const createFakeLongRunTask = () => {
    return new Promise((resolve, reject) => {
        setTimeout(() => {
            resolve('Response');
        }, 1000);
    });
};

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
  connection.createChannel(function(error1, channel) {
    channel = channel;
    if (error1) {
      throw error1;
    }

    channel.consume(
        queue,
        async (msg) => {
            console.log('Message processed successfully with correlationId and content',
                msg.properties.correlationId,
                msg.content.toString('utf-8'));
            const result = await createFakeLongRunTask();
            channel.sendToQueue(msg.properties.replyTo, Buffer.from(result), {
                correlationId: msg.properties.correlationId,
                expiration: 30000
            });
        },
        { noAck: true },
    );
  });
});

async function sendRpcMessage(msg) {
    const correlationId = uuid.v4();
    return new Promise((resolve, reject) => {
        const messageReplyHandler = (result) => {
            const jsonParsedResult = JSON.parse(result);
            console.log('Resolved message', correlationId, jsonParsedResult);
            responseEmitter.removeAllListeners(correlationId);
            resolve(jsonParsedResult);
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
