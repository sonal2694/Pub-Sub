const express = require('express');
const bodyParser = require('body-parser');
const fsPromises = require('fs').promises;
const shell = require('shelljs');
const child_process = require('child_process');

// Constants
const PORT = 3000;
const HOST = '0.0.0.0';

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(bodyParser.json());

//enable CORs
app.use((req, res, next) => {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
    next();
});

app.route('/')
.post((req, res, next) => {
    var inputCode = req.body.inputCode;

    fsPromises.writeFile('input.py', inputCode, 'utf8')
    .then((resp) => {
        let output = shell.exec('python input.py');
        console.log(output);
    
        // var output = shell.exec('docker logs -f inputdockercontainer').stdout;
        // shell.exec('docker container rm inputdockercontainer');
        res.send(output.stdout);
    })
    .catch((err) => {
        return console.log(err);
    });

});

app.listen(PORT, HOST);
module.exports = app;