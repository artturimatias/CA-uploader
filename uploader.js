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
const url = 'https://oscari.oscapps.jyu.fi/providence/index.php/editor/objects/ObjectEditor/Edit/Screen41/object_id/';

// path of your local files
const path = 'files/'

const filename = "links.csv"
// ************************************************************************

var links = [];
var failures = [];
var counter = 0;
var stream = fs.createReadStream(filename);
 
var csvStream = csv()
	.on("data", function(data){
		 links.push(data);
	})
	.on("end", function(){
		console.log("CSV read!");
		loop(links);
	});
 
stream.pipe(csvStream);

async function loop(links) {
	var i,j,temparray,chunk = 40;
	for (i = 0, j = links.length; i<j; i+=chunk) {
		temparray = links.slice(i,i+chunk);
		// do whatever
		await main(temparray);
	}
}

async function main(data, cb) {
	
	var failure = true;
		
	const browser = await puppeteer.launch({headless: false});
	const page = await browser.newPage();
	
	// keep trying login 
	while(failure) {
		try {
			// open browser
			await page.setViewport({width: 1600, height: 920})
			await page.goto(login_url);

			// log in
			await page.type('[name="username"]', username);
			await page.type('[name="password"]', password);
			await Promise.all([
			  page.click('a'),
			  page.waitForNavigation()
			]);
			failure = false;
		} catch(e) {
			console.log(e.message);
			failure = true;
		}
	}
	/*
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
*/

	// upload images
	for(const image of data) {
		var filename = image[2];
		var label = image[1].replace(/"/g,'');
		var obj_id = image[0];
		failure = true;
		if (fs.existsSync(path + filename)) {
			if(fs.lstatSync(path + filename).isFile() && !isNaN(obj_id)) {
				while(failure) {
					try {

						console.log('Opening: ' + url + obj_id);
						await page.waitFor(2000);
						await page.goto(url + obj_id,  {waitUntil: 'networkidle0'});
					   
						// click "Add representation" link
						const thumb = await page.$('.caObjectRepresentationListItemImageThumb');
						if(thumb) {
								await page.click('.caAddItemButton a');
								//await page.waitFor(200);
						}
						// set label
						const textareas = await page.$$('.formLabel textarea');
						await textareas[textareas.length-1].type(label);
						// set filename
						const inputs = await page.$$('input[type="file"]');
						await inputs[inputs.length-1].uploadFile(path + filename)
						
						console.log('Uploading: ' + filename);
					   
						// for debugging
						await page.evaluate(() => {
							let dom = document.querySelector('.control-box-left-content a.form-button span');
							dom.innerHTML = "Clicking this"
						});
						
						await Promise.all([
								page.click('.control-box-left-content a.form-button'),
								page.waitForNavigation()
						]);   
						
						counter++;
						console.log('processed: ' + counter);
						failure = false;
						await page.waitFor(2000); 
						   
					} catch(e) {
							console.log('File upload failed: ' + e.message);
							//failures.push(filename);
							try {
								await page.reload();
								failure = true; // try again
							} catch(e) {
								failure = false; // reload failed, give up
								failures.push(filename);
							}
					}
				}
			} else {
					console.log('File not found: ' + filename);
			}
		} else {
			console.log("not found: " + path + filename);
		}
	}
	console.log("\nDone!\n")
	console.log('Failed uploads:')
	console.log(failures);

	await browser.close();

}

