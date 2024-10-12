async function printContent(objPrint) {
    try {
      // Load the image from a URL or a local path
      const img = new Image();
      img.src = 'icons/icon-192.png'; // Replace with your image path
      img.crossOrigin = 'Anonymous';
  
      img.onload = async function () {
        const maxWidth = 216; // Maximum width for 55mm in pixels assuming 200 dpi resolution
  
        // Resize the image to fit within the width limit
        const resizedImage = resizeImage(img, maxWidth);
  
        // Create a canvas and draw the resized image
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
  
        // Set the canvas size based on image size plus text area
        const lineHeight = 20;
        const text = 'This is an example text that will be wrapped automatically if it is too long to fit in the specified width.';
        const textHeight = calculateTextHeight(ctx, text, maxWidth, lineHeight);
        canvas.width = maxWidth;
        canvas.height = resizedImage.height + textHeight;
  
        // Draw the resized image on the canvas
        ctx.drawImage(resizedImage, 0, 0);
  
        // Set text properties and draw the wrapped text below the image
        ctx.font = '16px Arial';
        ctx.fillStyle = 'black';
        wrapText(ctx, text, 0, resizedImage.height + 20, maxWidth, lineHeight);
  
        // Convert the canvas data to bitmap
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const bitmap = decodeBitmap(imageData);
  
        // Connect and print the bitmap to the Bluetooth printer in chunks of 512 bytes
        await connectAndPrintInChunks(bitmap,objPrint);
      };
  
      img.onerror = function () {
        console.error("Print Photo error: the file doesn't exist");
      };
    } catch (e) {
      console.error("PrintTools error:", e);
    }
  }
  
  function resizeImage(img, maxWidth) {
    const aspectRatio = img.height / img.width;
  
    // If the image width exceeds the max width, scale it down proportionally
    if (img.width > maxWidth) {
      const canvas = document.createElement('canvas');
      canvas.width = maxWidth;
      canvas.height = maxWidth * aspectRatio;
  
      const ctx = canvas.getContext('2d');
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
  
      return canvas;
    }
  
    return img; // Return original image if resizing is not needed
  }
  
  function calculateTextHeight(context, text, maxWidth, lineHeight) {
    const words = text.split(' ');
    let line = '';
    let height = 0;
  
    for (let n = 0; n < words.length; n++) {
      const testLine = line + words[n] + ' ';
      const metrics = context.measureText(testLine);
      const testWidth = metrics.width;
  
      if (testWidth > maxWidth && n > 0) {
        height += lineHeight;
        line = words[n] + ' ';
      } else {
        line = testLine;
      }
    }
  
    height += lineHeight;
    return height;
  }
  
  function wrapText(context, text, x, y, maxWidth, lineHeight) {
    const words = text.split(' ');
    let line = '';
  
    for (let n = 0; n < words.length; n++) {
      const testLine = line + words[n] + ' ';
      const metrics = context.measureText(testLine);
      const testWidth = metrics.width;
  
      if (testWidth > maxWidth && n > 0) {
        context.fillText(line, x, y);
        line = words[n] + ' ';
        y += lineHeight;
      } else {
        line = testLine;
      }
    }
    context.fillText(line, x, y);
  }
  
  function decodeBitmap(imageData) {
    const data = imageData.data;
    const width = imageData.width;
    const height = imageData.height;
    const bitmap = [];
  
    // Convert the image data to a black and white bitmap for thermal printing
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const index = (y * width + x) * 4;
        const r = data[index];
        const g = data[index + 1];
        const b = data[index + 2];
        const alpha = data[index + 3];
  
        // Convert RGB to grayscale
        const grayscale = (r + g + b) / 3;
  
        // Apply a simple threshold to generate a black and white image
        // A threshold value of 128 is used here: pixels below 128 become black, others become white
        bitmap.push(grayscale < 128 ? 0 : 1);
      }
    }
  
    return bitmap;
  }
  
  async function connectAndPrintInChunks(bitmap,objPrint) {
    try {

        //alert(JSON.stringify(objPrint))
        const uuid = objPrint.uuid,
             uuidc = objPrint.uuidc;
      // Request a Bluetooth device with a specific name or service
      const device = await navigator.bluetooth.requestDevice({        
        filters: [{ services: [objPrint.uuid], name: objPrint.name }],
        optionalServices: [objPrint.uuidc] // Replace with your printer's service UUID
      });
      
      
      //alert(device)
      console.log(device)
      // Connect to the GATT server of the Bluetooth device
      const server = await device.gatt.connect();
      //alert(server)
      console.log(server)
      const service = await server.getPrimaryService(uuid);
      //alert(service)
      console.log(service)
      const characteristic = await service.getCharacteristic(uuidc);
      //alert(characteristic)
      console.log(characteristic)
      // Format the bitmap into a command format that the thermal printer understands
      const command = createPrintCommand(bitmap);
      
      await characteristic.writeValueWithoutResponse(bitmap);
      // Split the command into chunks of 512 bytes
      const chunkSize = 512;
      for (let i = 0; i < command.length; i += chunkSize) {
        const chunk = command.slice(i, i + chunkSize);
        alert(chunk)
        await characteristic.writeValueWithoutResponse(chunk);
      }
  alert("primiu?")
      console.log("Print successful");
    } catch (error) {
      alert("Error during Bluetooth communication:", error)
        console.error("Error during Bluetooth communication:", error);
    }
  }
  
  function createPrintCommand(bitmap) {
    // This function generates the byte command to print the bitmap using ESC/POS commands or similar
    // Adjust the logic based on the printer's specification
    const SELECT_BIT_IMAGE_MODE = [0x1B, 0x2A, 33, bitmap.length & 0xff, (bitmap.length >> 8) & 0xff];
    const bitmapArray = new Uint8Array(SELECT_BIT_IMAGE_MODE.concat(bitmap));
    return bitmapArray;
  }
  

 function checkDataExists(key) {
    return localStorage.getItem(key);
    // const data = localStorage.getItem(key);
    // return data !== null; // Returns true if data exists, false otherwise
}

document.getElementById('connectButton').addEventListener('click', async () => {
    // Example usage
    console.log(new Date().toISOString())
    let objLocal = checkDataExists ("blueImp")
    if(!objLocal) { alert("Necessário instalar a impressora primeiro!\nRedirecionando..."); location.href = "getme.html"; return;}
    
    printContent(JSON.parse(objLocal));
})
  