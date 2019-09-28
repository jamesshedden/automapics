const saveButton = document.getElementById('save-image');
const createImageButton = document.getElementById('create-image');
const flipHorizontallyButton = document.getElementById('flip-horizontally');
const flipVerticallyButton = document.getElementById('flip-vertically');
const rotateLeftButton = document.getElementById('rotate-left')
const rotateRightButton = document.getElementById('rotate-right')

const imageContainer = document.getElementById('image-container-image');
const imageCropPreviewElement = document.getElementById('image-crop-preview')
const xPositionRangeElement = document.getElementById('x-position-range');
const yPositionRangeElement = document.getElementById('y-position-range');
const scaleRangeElement = document.getElementById('scale-range');
const hueRangeElement = document.getElementById('hue-range');
const saturateRangeElement = document.getElementById('saturate-range');
const topLeftXCoordinateElement = document.getElementById('top-left-x-coordinate-text')
const topLeftYCoordinateElement = document.getElementById('top-left-y-coordinate-text')
const widthElement = document.getElementById('width-text')
const heightElement = document.getElementById('height-text')

const IMAGE_WIDTH = 1800
const IMAGE_HEIGHT = IMAGE_WIDTH
const FRAME_WIDTH = 300
const FRAME_HEIGHT = 533
const MIN_SCALE = 29.6

const croppedImageUrl = (transforms, hue, saturate) => {
    return `http://localhost:3000/screenshot.html?transforms=${transforms}&hue=${hue}&saturate=${saturate}`;
}

const imageUrl = () => {
    return `http://localhost:3000/temp_screenshot.png?${Date.now().toString()}`;
}

const formatXPosition = (xRangeValue) => (getScaledImageWidth() - FRAME_WIDTH) * (xRangeValue / 100);
const formatYPosition = (yRangeValue) => (getScaledImageWidth() - FRAME_HEIGHT) * (yRangeValue / 100);

const setXPosition = (position) => imageContainer.style.right = `${parseInt(position) * -1}px`;
const setYPosition = (position) => imageContainer.style.bottom = `${parseInt(position) * -1}px`;

const getScaledImageWidth = () => IMAGE_WIDTH * (getScale() / 100)
const getScaledImageHeight = () => IMAGE_HEIGHT * (getScale() / 100)

const getScale = () => scaleRangeElement.value

const getXPosition = () => xPositionRangeElement.value
const getYPosition = () => yPositionRangeElement.value

const setPosition = (setter, formatter, value) => setter(formatter(value, getScale()));

const setImageDimensions = (dimension) => {
    imageContainer.style.width = `${parseInt(dimension)}px`;
    imageContainer.style.height = `${parseInt(dimension)}px`;
}

let transformState = {
    verticalFlip: false,
    horizontalFlip: false,
    rotationDegrees: 0,
}

let hue = 0
let saturate = 0

const rotations = [0, 90, 180, 270]

const updateTransformState = (newState) => {
    if (newState.rotationDegrees > 3) newState.rotationDegrees = 0
    if (newState.rotationDegrees < 0) newState.rotationDegrees = 3

    transformState = { ...transformState, ...newState };
}

const getTransformProperties = () => {
    return [
        transformState.horizontalFlip ? 'scaleX(-1)' : null,
        transformState.verticalFlip ? 'scaleY(-1)' : null,
        `rotate(${rotations[transformState.rotationDegrees]}deg)`
    ].join(' ')
}

const setTransformProperties = (element) => {
    element.style.transform = getTransformProperties()
}

function getScreenshotParameters() {
    let xOffsetPx = (getScaledImageWidth() - FRAME_WIDTH) * ((100 - getXPosition()) / 100);
    let yOffsetPx = (getScaledImageHeight() - FRAME_HEIGHT) * ((100 - getYPosition()) / 100);

    return {
        x: parseInt(xOffsetPx * (IMAGE_WIDTH / getScaledImageWidth())),
        y: parseInt(yOffsetPx * (IMAGE_HEIGHT / getScaledImageHeight())),
        width: parseInt(FRAME_WIDTH * (IMAGE_WIDTH / getScaledImageWidth())),
        height: parseInt(FRAME_HEIGHT * (IMAGE_HEIGHT / getScaledImageHeight())),
    };
}

saveButton.addEventListener('click', () => {
    let { x, y, width, height } = getScreenshotParameters()

    let body = {
        url: croppedImageUrl(getTransformProperties(), hue, saturate),
        x,
        y,
        width,
        height,
    }

    fetch(
        '/crop',
        {
            method: 'post',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(body)
        }
    ).then(response => response.text())
    .then((image) => {
        return fetch(
            '/create',
            {
                method: 'post',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({image}),
            }
        )
    })
})

createImageButton.addEventListener('click', () => {
    imageContainer.innerHTML = '';
    createImageButton.disabled = true

    fetch('/image').then(response => response.text()).then(() => {
        let img = document.createElement('img');
        img.src = imageUrl();
        imageContainer.appendChild(img);

        setPosition(setXPosition, formatXPosition, getXPosition());
        setPosition(setYPosition, formatYPosition, getYPosition());
        setImageDimensions(getScaledImageWidth(IMAGE_WIDTH));

        createImageButton.disabled = false
    })
})

flipHorizontallyButton.addEventListener('click', () =>  {
    updateTransformState({ horizontalFlip: !transformState.horizontalFlip })
    setTransformProperties(imageContainer)
});

flipVerticallyButton.addEventListener('click', () => {
    updateTransformState({ verticalFlip: !transformState.verticalFlip })
    setTransformProperties(imageContainer)
});

rotateLeftButton.addEventListener('click', () => {
    updateTransformState({ rotationDegrees: transformState.rotationDegrees - 1 })
    setTransformProperties(imageContainer)
})

rotateRightButton.addEventListener('click', () => {
    updateTransformState({ rotationDegrees: transformState.rotationDegrees + 1 })
    setTransformProperties(imageContainer)
})

xPositionRangeElement.addEventListener('input', (event) => {
    setPosition(setXPosition, formatXPosition, event.target.value);
});

yPositionRangeElement.addEventListener('input', (event) => {
    if (getScale() <= MIN_SCALE) return false;
    setPosition(setYPosition, formatYPosition, event.target.value);
});

scaleRangeElement.addEventListener('input', () => {
    setPosition(setXPosition, formatXPosition, getXPosition());
    setPosition(setYPosition, formatYPosition, getYPosition());
    setImageDimensions(getScaledImageWidth(IMAGE_WIDTH));
});

hueRangeElement.addEventListener('input', (event) => {
    imageContainer.style.filter = `hue-rotate(${event.target.value}deg) saturate(${saturate}%)`
    hue = event.target.value
});

saturateRangeElement.addEventListener('input', (event) => {
    imageContainer.style.filter = `hue-rotate(${hue}deg) saturate(${event.target.value}%)`
    saturate = event.target.value
});