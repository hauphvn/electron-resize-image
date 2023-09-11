const img = document.querySelector('#img');
const form = document.querySelector('#img-form');
const heightInput = document.querySelector('#height');
const widthInput = document.querySelector('#width');
const fileName = document.querySelector('#filename');
const outPutPath = document.querySelector('#output-path');

const checkAcceptImg = (file) => {
    const acceptImgTypes = ['image/gif', 'image/png', 'image/jpeg'];
    return file && acceptImgTypes.includes(file['type']);
};

function onChangeImg(event) {
    const file = event?.target.files[0];
    const validateImg = checkAcceptImg(file);
    if (!validateImg) {
        alertError('Vui lòng chọn tập tin hình ảnh');
        return;
    }
    const image = new Image();
    image.src = URL.createObjectURL(file);
    image.onload = function () {
        widthInput.value = image.width;
        heightInput.value = image.height;
    }
    fileName.innerText = file.name;
    form.style.display = 'block';
    outPutPath.innerText = path.join(os.homedir(), 'imageResizer')
}

// Send data to main
function sendImage(event) {
    event.preventDefault();
    if (!img.files[0]) {
        alertError('Please upload an image!');
        return;
    }
    const width = widthInput.value;
    const height = heightInput.value;
    if(!width || !height || width === 0 || height === 0){
        alertError('Please fill in a width and height');
        return;
    }
    const pathImg = img.files[0].path;
    // Send to main using IPCRendered
    ipcRenderer.send('image:resize', {
        pathImg,
        width,
        height
    })
}

// Catch the image:done event
ipcRenderer.on('image:done', () => {
    alertSuccess(`Image resized to ${widthInput.value} x ${heightInput.value}`);
})

function alertError(message) {
    Toastify.toast({
        text: message,
        duration: 5000,
        close: false,
        style: {
            background: 'red',
            color: 'white',
            textAlign: 'center'
        }
    });
}

function alertSuccess(message) {
    Toastify.toast({
        text: message,
        duration: 5000,
        close: false,
        style: {
            background: 'green',
            color: 'white',
            textAlign: 'center'
        }
    });
}

img.addEventListener('change', onChangeImg);

form.addEventListener('submit', sendImage)