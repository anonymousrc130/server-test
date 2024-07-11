import express from "express";
import bodyParser from "body-parser";
import { exec } from "child_process";

const app = express();
const port = process.env.PORT || 3000; // Use environment variable for port or default to 3001

app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static("public"));

app.post("/run-script", (req, res) => {
  const startPage = req.body.startPage;
  const maxPage = req.body.maxPage;

  const command = `node index.js ${startPage} ${maxPage}`;
  exec(command, (error, stdout, stderr) => {
    if (error) {
      console.error(`exec error: ${error}`);
      return res.status(500).send(`Error: ${error.message}`);
    }
    if (stderr) {
      console.error(`stderr: ${stderr}`);
      return res.status(500).send(`Stderr: ${stderr}`);
    }
    console.log(`stdout: ${stdout}`);
    res.send("Script executed successfully. Check the result.xlsx file.");
  });
});

// Listen on the specified port and host
app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});