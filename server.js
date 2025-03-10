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
    console.log('Username:', username, 'Password:', '***');

    // Run GitHub Actions workflow using spawn
    const ghProcess = spawn('gh', [
        'workflow', 'run', 'clocker.yaml',
        '--repo', 'umer279/factorial-clocker',
        '-f', `username=${username}`,
        '-f', `password=${password}`
    ]);

    let stdoutData = '';
    let stderrData = '';

    ghProcess.stdout.on('data', (data) => {
        stdoutData += data.toString();
        console.log(`Stdout: ${data}`);
    });

    ghProcess.stderr.on('data', (data) => {
        stderrData += data.toString();
        console.error(`Stderr: ${data}`);
    });

    ghProcess.on('close', (code) => {
        console.log(`GH CLI process exited with code ${code}`);
        if (code === 0) {
            res.json({ message: `Workflow triggered successfully. Output: ${stdoutData}` });
        } else {
            res.status(500).json({ message: `Error: Workflow failed with code ${code}. Output: ${stderrData}` });
        }
    });

    ghProcess.on('error', (err) => {
        console.error(`Failed to start GH CLI process: ${err.message}`);
        res.status(500).json({ message: `Error: ${err.message}` });
    });

    // Handle request cancellation
    req.on('aborted', () => {
        if (ghProcess) {
            ghProcess.kill('SIGTERM');
            console.log('Workflow request cancelled due to client abortion');
        }
    });
});


app.post('/cancel-test', (req, res) => {
    if (playwrightProcess) {
        playwrightProcess.kill('SIGTERM');  // Terminate the process
        playwrightProcess = null;
        console.log('Playwright process terminated due to cancel request');
        res.status(200).json({ message: 'Test process cancelled' });
    } else {
        res.status(400).json({ message: 'No test process to cancel' });
    }
});



app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
});
