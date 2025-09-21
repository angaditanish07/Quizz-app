const { spawn } = require('child_process');
const path = require('path');

console.log('🚀 Starting Quiz Application...\n');

// Start backend server
console.log('📡 Starting backend server...');
const server = spawn('npm', ['run', 'server'], {
  cwd: path.join(__dirname, 'server'),
  stdio: 'inherit',
  shell: true
});

// Start frontend client
console.log('⚛️  Starting React client...');
const client = spawn('npm', ['start'], {
  cwd: path.join(__dirname, 'client'),
  stdio: 'inherit',
  shell: true
});

// Handle process termination
process.on('SIGINT', () => {
  console.log('\n🛑 Shutting down servers...');
  server.kill('SIGINT');
  client.kill('SIGINT');
  process.exit(0);
});

server.on('error', (err) => {
  console.error('❌ Backend server error:', err);
});

client.on('error', (err) => {
  console.error('❌ Frontend client error:', err);
});

console.log('✅ Both servers are starting...');
console.log('🌐 Frontend: http://localhost:3000');
console.log('🔧 Backend: http://localhost:5000');
console.log('📝 Press Ctrl+C to stop both servers\n');
