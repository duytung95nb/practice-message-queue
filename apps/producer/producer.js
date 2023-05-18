const express = require('express')
const sendRpcMessage = require('./messageQueue')
const app = express()
const port = process.env.PORT || 3000

app.get('/produce', async (req, res) => {
    try {
        const result = await sendRpcMessage('Hello world!');
        res.send(result);
    }
    catch(e) {
        console.log('Error', e);
        res.status(408).send(e);
    }
})

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`)
})