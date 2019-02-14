# CA-uploader


A Puppeteer based file uploader for [CollectiveAccess](https://collectiveaccess.org/) 

## What is this?

Currently CollectiveAccess has no REST api for uploading files for media representations. This is a workaround for that. USE AT YOUR OWN RISK!

The script uses [Puppeteer](https://github.com/GoogleChrome/puppeteer) for uploading image through the GUI of CollectiveAccess. The user must provide a csv file with image label, file name and object id.

## Install


    git clone https://github.com/artturimatias/CA-uploader.git
    cd CA-uploader
    npm install


## Usage
First you need to define the address of your CA instance and user credentials. These are defined in loader.js.


    // CA username
    const username = "administrator";
    
    // CA password
    const password = "";
    
    // URL of your CA instance providence login page
    const login_url = "http://localhost/providence";
    
    // URL of your CA instance object editor where you can add media representations (profile specific)
    const url = 'http://localhost/providence/index.php/editor/objects/ObjectEditor/Edit/Screen41/object_id/';
    
    // path of your local files
    const path = 'files/'
    
    // CSV filename
    const filename = "links.csv"

Project contains a sample csv file (links.csv) wiht sample files. You can test with your TEST ENVIRONMENT by typing:
    
        node uploader.js


This should open browser and you can see how files are uploaded :)

## running headless

If you want to run headless (without seeing the browser), just change this line:

    const browser = await puppeteer.launch({headless: false});
to this:

    const browser = await puppeteer.launch({headless: true});

