const video = document.getElementById("video");
const videoContainer = document.getElementById("video-container");

const MODEL_URI = "/models";

Promise.all([
    faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URI),
    faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URI),
    faceapi.nets.faceRecognitionNet.loadFromUri(MODEL_URI),
    faceapi.nets.faceExpressionNet.loadFromUri(MODEL_URI),
    faceapi.nets.ageGenderNet.loadFromUri(MODEL_URI),
])
    .then(playVideo)
    .catch((err) => {
        console.log(err);
    });

function playVideo() {
    if(! navigator.mediaDevices){
        console.error("mediaDevices não suportado")
        return;
    }
    navigator.mediaDevices
        .getUserMedia({
            video: {
                width: { min: 640, ideal: 1280, max: 1920 },
                height: { min: 360, ideal: 720, max: 1080 },
            },
            audio: false,
        })
        .then( function (stream) {
            video.srcObject = stream;
        })
        .catch( function (err) {
            console.log(err);
        });
}

video.addEventListener("play", () => {
    //Criando o canvas
    const canvas = faceapi.createCanvasFromMedia(video);

    canvas.willReadFrequently = true;
    videoContainer.appendChild(canvas);

    const canvasSize = { width: video.width, height: video.height };
    faceapi.matchDimensions(canvas, canvasSize);

    setInterval(async () => {
        const detections = await faceapi
            .detectAllFaces(video, new faceapi.TinyFaceDetectorOptions())
            .withFaceLandmarks()
            .withFaceExpressions()
            .withAgeAndGender();

            const DetectionsArray = faceapi.resizeResults(detections, canvasSize);
            canvas.getContext("2d").clearRect(0, 0, canvas.width, canvas.height);
            detectionsDraw(canvas, DetectionsArray);
    }, 10);
});

function detectionsDraw(canvas, DetectionsArray) {
    faceapi.draw.drawDetections(canvas, DetectionsArray);
    faceapi.draw.drawFaceLandmarks(canvas, DetectionsArray);
    faceapi.draw.drawFaceExpressions(canvas, DetectionsArray);

    DetectionsArray.forEach((detection) => {
        const box = detection.detection.box;
        const drawBox = new faceapi.draw.DrawBox(box, {
            label: `${Math.round(detection.age)}y, ${detection.gender}`
        });
        drawBox.draw(canvas);
    });
}