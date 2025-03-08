const express = require('express');
const { spawn } = require('child_process');
const app = express();
const port = 3000;

app.use(express.json());
app.use(express.static('public'));

let playwrightProcess = null;

app.post('/run-test', (req, res) => {
    console.log('Request received');
    const { username, password } = req.body;
    console.log('Username:', username, 'Password:', password);

    // Set environment variables for Playwright
    process.env.USERNAME = username;
    process.env.PASSWORD = password;

    // Run Playwright test using spawn
    playwrightProcess = spawn('npx', ['playwright', 'test']);

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
        playwrightProcess = null;
        if (code === 0) {
            res.json({ message: `Test completed successfully. Output: ${stdoutData}` });
        } else {
            res.json({ message: `Error: Test failed with code ${code}. Output: ${stderrData}` });
        }
    });

    playwrightProcess.on('error', (err) => {
        console.error(`Failed to start Playwright process: ${err.message}`);
        res.status(500).json({ message: `Error: ${err.message}` });
    });

    // Handle request cancellation
    req.on('aborted', () => {
        if (playwrightProcess) {
            playwrightProcess.kill('SIGTERM');
            playwrightProcess = null;
            console.log('Test cancelled due to request abortion');
        }
    });
});



app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
});
