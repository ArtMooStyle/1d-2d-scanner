# QR Scanner

| 1D product | 1D industrial       | 2D             |
| ---------- | ------------------- | -------------- |
| ~~UPC-A~~  | Code 39             | QR Code        |
| ~~UPC-E~~  | ~~Code 93~~         | Data Matrix    |
| EAN-8      | Code 128            | ~~Aztec~~ \*   |
| EAN-13     | ~~Codabar~~         | ~~PDF 417~~ \* |
|            | ITF                 | ~~MaxiCode~~   |
|            | RSS-14              |
|            | ~~RSS-Expanded~~ \* |

## Setup

`qr-scanner.min.js` is the main API as an es6 module and can be imported as follows:
```js
import QrScanner from 'path/to/qr-scanner.min.js'; // if using plain es6 import
import QrScanner from 'qr-scanner'; // if installed via package and bundling with webpack or rollup
```
This requires the importing script to also be an es6 module or a module script tag, e.g.:
```html
<script type="module">
    import QrScanner from 'path/to/qr-scanner.min.js';
    // do something with QrScanner
</script>
```

## Usage

```js   
this.video = document.getElementById('qr-video') as HTMLVideoElement;
this.scanner = new QrScanner(this.video, result => 
    this.onDecode(result, this)
);
this.scanner.start();

this.scanner.stop();
this.scanner.destroy();
```

### Web Cam Scanning

#### 1. Create HTML
Create a `<video>` element where the web cam video stream should get rendered: 
```html
<video></video>
```

## Build the project
The project is prebuild in qr-scanner.min.js.

Install required build packages:
```batch
npm install
```

Building:
```batch
npm run build
```

