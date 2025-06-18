const WebSocket = require('ws');
const ws = new WebSocket('ws://localhost:5000');

ws.onopen = function() {
    console.log('WebSocket connection established');
    ws.send(JSON.stringify({
        type: 'message',
        id: 'test-msg-1',
        fromUser: 'test-user',
        toUser: 'recipient-user',
        message: 'This is a test message for real-time messaging!'
    }));
};

ws.onmessage = function(data) {
    console.log('Received data: %s', data);
};

ws.onerror = function(error) {
    console.error('WebSocket error:', error);
};

ws.onclose = function() {
    console.log('WebSocket connection closed');
};