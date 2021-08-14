// Node modules
const express = require('express')
const bodyParser = require("body-parser");
const fs = require("fs");
const path = require("path");
const multer = require("multer");

// Express configuration
const app     = express()
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
//app.use(cors());
app.use(express.static("public"));
app.use('/css', express.static(__dirname + 'public/css'))
app.use('/img', express.static(__dirname + 'public/img'))
app.set('view engine', 'ejs');


// Multer handles storage of HTTP requests containing file content.
var storage = multer.diskStorage(
	{
  	destination: function(req, file, cb)
		{
    	cb(null, "public/uploads");
  		},
		filename: function (req, file, cb) 
		{
    	cb(null, file.fieldname + "-" + Date.now() + path.extname(file.originalname));
  		},
	});

const ocrmypdf = function (req, file, callback) 
	{
	var ext = path.extname(file.originalname);
  	if(ext !== ".pdf")
  		{
    	return callback("This Extension is not supported");
  		}
  	callback(null, true);
	};

const ocrmypdfupload = multer({storage:storage,fileFilter:ocrmypdf})
const servicePort = 4000;
const pageTitle = "GilbyIM OcrMyPdf Service"


/**
 * Express
 */
app.listen(servicePort)

console.log("Server listening on port: " + servicePort)
		
app.get('/',(req,res) => 
	{
	res.render('index', {title: pageTitle, serviceUrl: "https://" + req.host + "/ocrmypdf" })
	})

app.post('*/', ocrmypdfupload.single('file'), async (req, res) => 
	{
	if(req.file)
		{
		console.log(req.file.path)

		res.download(await doOCR(req.file.path), (err) =>
			{
			if(err)
				{
				fs.unlinkSync(req.file.path)
				res.send("An error has occurred in the OCR process.")
				}
			fs.unlinkSync(req.file.path)				
			})
		}
	})
	
/**
 * GET - Health check
 */
app.get('*/health', (req, res) => res.sendStatus(200))

/**
 * Not Found
 */
app.use((req, res, next) => res.status(404).send({ status: "error", "msg": "404 Not Found" }))

/**
 * Functions
 */
async function doOCR(file)
	{
	const exec  = require('await-exec')
	const outputFile = file.replace('.pdf', '-ocr.pdf')
	const ocrResult = await exec(`ocrmypdf -l spa --output-type pdfa --optimize 3 --skip-text ${file} ${outputFile}`, { timeout: 900000 })
	return outputFile
	fs.unlinkSync(outputFile)
	}