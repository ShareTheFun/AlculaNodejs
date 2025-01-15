const express = require('express');
const fs = require('fs');
const path = require('path');

const app = express();
const port = 3000;

// Serve static files (HTML, CSS, etc.)
app.use(express.static(path.join(__dirname, 'public')));

// Middleware to parse JSON bodies
app.use(express.json());

// Route to save confession
app.post('/save-confession', (req, res) => {
    const confession = req.body;
    const randomNum = Math.floor(Math.random() * 10000); // Random number for file name
    const fileName = path.join(__dirname, 'upload', `Anonymous${randomNum}.json`);

    // Save confession as a JSON file
    fs.writeFile(fileName, JSON.stringify(confession, null, 2), (err) => {
        if (err) {
            return res.status(500).json({ message: 'Error saving confession' });
        }
        res.json({ message: 'Confession saved successfully', file: fileName });
    });
});

// Route to get all confessions
app.get('/get-confessions', (req, res) => {
    const confessions = [];

    // Read all JSON files from the upload directory
    fs.readdir(path.join(__dirname, 'upload'), (err, files) => {
        if (err) {
            return res.status(500).json({ message: 'Error reading confessions' });
        }

        // Read each file and push to confessions array
        files.forEach((file) => {
            if (file.endsWith('.json')) {
                const filePath = path.join(__dirname, 'upload', file);
                const confession = JSON.parse(fs.readFileSync(filePath, 'utf8'));

                // Check if the confession is older than 24 hours
                const fileTime = new Date(confession.timestamp);
                const currentTime = new Date();
                const timeDifference = currentTime - fileTime;

                // Calculate the remaining time until deletion
                const timeLeft = 86400000 - timeDifference; // 24 hours in ms

                if (timeLeft <= 0) {
                    fs.unlinkSync(filePath); // Delete the confession if it has expired
                    console.log(`Deleted confession: ${file}`);
                } else {
                    const remainingTime = {
                        hours: Math.floor(timeLeft / (1000 * 60 * 60)),
                        minutes: Math.floor((timeLeft % (1000 * 60 * 60)) / (1000 * 60)),
                        seconds: Math.floor((timeLeft % (1000 * 60)) / 1000)
                    };
                    confession.timeLeft = remainingTime; // Add the remaining time to the confession object
                    confessions.push(confession);
                }
            }
        });

        res.json(confessions);
    });
});

// Start the server
app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
});
