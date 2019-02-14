const puppeteer = require('puppeteer');
const fs = require('fs');
var csv = require("fast-csv");

// ************************************************************************
// CA username
const username = "administrator";

// CA password
const password = "";

// URL of your CA instance login page
const login_url = "http://localhost/providence";

// URL of your CA instance object editor where you can add media representations (installation specific)
const url = 'http://localhost/providence/index.php/editor/objects/ObjectEditor/Edit/Screen42/object_id/';

// path of your local files
const path = 'files/'

const filename = "links.csv"
// ************************************************************************

var links = [];
var stream = fs.createReadStream(filename);
 
var csvStream = csv()
	.on("data", function(data){
		 links.push(data);
	})
	.on("end", function(){
		console.log("CSV read!");
		main(links);
	});
 
stream.pipe(csvStream);

async function main(data, cb) {
	
	var failures = [];
		
	const browser = await puppeteer.launch({headless: false});

	// open browser
	const page = await browser.newPage();
	await page.setViewport({width: 1600, height: 920})
	await page.goto(login_url);

	// log in
	await page.type('[name="username"]', username);
	await page.type('[name="password"]', password);
	await Promise.all([
	  page.click('a'),
	  page.waitForNavigation()
	]);
	
	
	// for debugging, can be removed
	await page.setRequestInterception(true);
	
	// for debugging, can be removed
	page.on('response', response => {
		if (response.url().includes("/object_id")) {
			  console.log("response code: ", response.status());
	  }
	});

	// for debugging, can be removed
	page.on('request', request => {
		if (request.method() == "POST") {
			console.log(request.method() + ':' + request.url());
		}
		request.continue();
	});


	// upload images
	for(const image of data) {
		if (fs.existsSync(path + image[1])) {
			if(fs.lstatSync(path + image[1]).isFile()) {
				try {
					console.log('Opening: ' + url + image[2]);
					await page.waitFor(2000);
					await page.goto(url + image[2],  {waitUntil: 'networkidle0'});
				   
					// click "Add representation" link
					const thumb = await page.$('.caObjectRepresentationListItemImageThumb');
					if(thumb) {
							await page.click('.caAddItemButton a');
							//await page.waitFor(200);
					}
					// set label
					var label = image[0].replace(/"/g,'');
					const textareas = await page.$$('textarea');
					await textareas[textareas.length-1].type(label);
					// set filename
					const inputs = await page.$$('input[type="file"]');
					await inputs[inputs.length-1].uploadFile(path + image[1])
					
					console.log('Uploading: ' + image[1]);
				   
					// for debugging
					//await page.evaluate(() => {
						//let dom = document.querySelector('.control-box-left-content a.form-button span');
						//dom.innerHTML = "Clicking this"
					//});
					
					await Promise.all([
							page.click('.control-box-left-content a.form-button'),
							page.waitForNavigation()
					]);    
					   
				} catch(e) {
						console.log('File upload failed: ' + e.message);
						failures.push(image[1]);
				}
			} else {
					console.log('File not found: ' + image[1]);
			}
		} else {
			console.log("not found: " + path + image[1]);
		}
	}
	console.log("\nDone!\n")
	console.log('Failed uploads:')
	console.log(failures);

	await browser.close();

}

