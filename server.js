var express = require('express');
var app = express();
var path = require('path');
var morgan = require('morgan');
var server = require('http').createServer(app)

var port = process.env.PORT || 5000;
var deque = []; // Initialize double-ended queue to insert from beginning and remove from end

connections = []

var socketServer = require('http').createServer(app)
var io = require('socket.io').listen(socketServer)


app.use(morgan('dev'));
app.use(express.static(__dirname + '/'));

app.get('*', function(req,res){
    res.sendFile(path.join(__dirname + '/index.html'));
});


io.on('connection', function(socket){
connections.push(socket);
console.log('Connected: %s sockets connected', connections.length);
//Print previous equations before the user has connected
var prevVal = "";
for(var each of deque) {
    prevVal = prevVal + each + "<br>";
  }

io.sockets.emit('display', { ctext : prevVal});

socket.on('disconnect', function(data){
connections.splice(connections.indexOf(socket), 1);
console.log('Disconnected: %s sockets connected', connections.length)

//io.sockets.emit('show connections', { connections: connections.length });
});

socket.on('str', function(data){
  var res = calculate(data);
  var finalVal = data + " = "+ res;
  deque.unshift(finalVal); // Insert equation at the beginning

  if(deque.length > 10) // If length greater than 10, remove least recent value from end of queue
  deque.pop();


  var valToDisplay = "";
  for(var each of deque) {
  valToDisplay = valToDisplay + each + "<br>";
  }

io.sockets.emit('display', { ctext : valToDisplay });
});

io.sockets.emit('show connections', { connections: connections.length });
});


socketServer.listen(port, function(){
console.log('Socket Server listening on: ' + port)
});

//Function to calculate value.
//Only integer values allowed.
//Uses Recursion to find corresponing closing bracket and solve the part first for priority over operators.
//Uses stack for priority of *, / over +, -
function calculate(s) {
var stack = [];
var sign = '+';
var num = 0;
for (var i = 0; i < s.length; i++) {
var l = s[i];
if (l.charCodeAt() >= '0'.charCodeAt() && l.charCodeAt() <= '9'.charCodeAt()) {
num = num * 10 + l.charCodeAt() - '0'.charCodeAt();
} else if (l === '(') {
var j = i + 1;
var cnt = 1;
            for (; j < s.length; j++) {
                if (s[j] === '(') cnt++;
                else if (s[j] === ')') cnt--;
                if (cnt === 0) break;
            }
            num = calculate(s.substring(i + 1, j));
            i = j;
        }

        if ((l.charCodeAt() < '0'.charCodeAt() && l !== ' ') || i === s.length - 1) {
            if (sign === '+') stack.push(num);
            if (sign === '-') stack.push(-num);
            if (sign === '*' || sign === '/') {
                var temp = (sign === '*') ? stack.pop() * num : ~~(stack.pop() / num);
                stack.push(temp);
            }
            sign = l;
            num = 0;
        }
    }
    return stack.reduce((a, b) => a + b, 0);  
}
