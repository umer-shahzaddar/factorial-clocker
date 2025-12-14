const express = require('express');
const { spawn } = require('child_process');
const app = express();
const port = 3000;

app.use(express.json());
app.use(express.static('public'));

// Enable CORS for all routes
app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Content-Type');
    if (req.method === 'OPTIONS') {
        return res.sendStatus(200);
    }
    next();
});

let playwrightProcess = null;

app.post('/run-test', (req, res) => {
    console.log('[CLOCKER] Request received at', new Date().toISOString());
    const { username, password } = req.body;
    console.log('[CLOCKER] Username:', username);

    if (!username || !password) {
        console.error('[CLOCKER] Missing credentials');
        return res.status(400).json({ message: 'Error: Username and password are required' });
    }

    // Create environment variables for the Playwright test
    const env = { ...process.env, USERNAME: username, PASSWORD: password };

    // Run Playwright test directly
    console.log('[CLOCKER] Spawning Playwright with command: npx playwright test');
    playwrightProcess = spawn('npx', ['playwright', 'test'], { env, shell: true });

    let stdoutData = '';
    let stderrData = '';

    console.log('[CLOCKER] Starting Playwright test process...');

    playwrightProcess.stdout.on('data', (data) => {
        const logEntry = data.toString();
        stdoutData += logEntry;
        console.log('[PLAYWRIGHT]', logEntry);
    });

    playwrightProcess.stderr.on('data', (data) => {
        const logEntry = data.toString();
        stderrData += logEntry;
        console.error('[PLAYWRIGHT ERROR]', logEntry);
    });

    playwrightProcess.on('close', (code) => {
        console.log(`[CLOCKER] Playwright process exited with code ${code} at ${new Date().toISOString()}`);
        playwrightProcess = null;
        if (code === 0) {
            console.log('[CLOCKER] Test completed successfully');
            res.json({ message: `Test completed successfully. Output: ${stdoutData}` });
        } else {
            console.log('[CLOCKER] Test failed with errors');
            res.status(500).json({ message: `Error: Test failed with code ${code}. Output: ${stderrData}` });
        }
    });

    playwrightProcess.on('error', (err) => {
        console.error(`[CLOCKER] Failed to start Playwright process: ${err.message}`);
        res.status(500).json({ message: `Error: ${err.message}` });
    });

    // Handle request cancellation
    req.on('aborted', () => {
        if (playwrightProcess) {
            playwrightProcess.kill('SIGTERM');
            console.log('[CLOCKER] Playwright process cancelled due to client abortion at', new Date().toISOString());
            playwrightProcess = null;
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
    console.log(`[CLOCKER] Server started at ${new Date().toISOString()}`);
    console.log(`[CLOCKER] Server running at http://localhost:${port}`);
    console.log('[CLOCKER] Ready to accept requests...');
});
