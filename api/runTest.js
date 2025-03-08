// api/runTest.js
const { spawn } = require('child_process');

export default function handler(req, res) {
  if (req.method === 'POST') {
    const { username, password } = req.body;

    console.log('Request received');
    console.log('Username:', username, 'Password:', password);

    // Set environment variables for Playwright
    process.env.USERNAME = username;
    process.env.PASSWORD = password;

    // Run Playwright test using spawn
    const playwrightProcess = spawn('npx', ['playwright', 'test']);

    let stdoutData = '';
    let stderrData = '';

    playwrightProcess.stdout.on('data', (data) => {
      stdoutData += data.toString();
      console.log(`Stdout: ${data}`);
    });

    playwrightProcess.stderr.on('data', (data) => {
      stderrData += data.toString();
      console.error(`Stderr: ${data}`);
    });

    playwrightProcess.on('close', (code) => {
      console.log(`Playwright process exited with code ${code}`);
      if (code === 0) {
        res.status(200).json({ message: `Test completed successfully. Output: ${stdoutData}` });
      } else {
        res.status(500).json({ message: `Error: Test failed with code ${code}. Output: ${stderrData}` });
      }
    });

    playwrightProcess.on('error', (err) => {
      console.error(`Failed to start Playwright process: ${err.message}`);
      res.status(500).json({ message: `Error: ${err.message}` });
    });

    // Handle request cancellation
    req.on('aborted', () => {
      console.log('Request aborted');
      playwrightProcess.kill('SIGTERM');
    });
  } else {
    res.status(405).json({ message: 'Method Not Allowed' });
  }
}
