let model, webcam;
let microbitPort = null;
let writer = null;
let lastSent = "";


// ===== เชื่อมต่อ micro:bit =====
async function connectMicrobit() {

    // ป้องกันเปิดซ้ำ
    if (microbitPort && microbitPort.readable) {
        console.log("Micro:bit already connected.");
        return;
    }

    try {
        microbitPort = await navigator.serial.requestPort();
        await microbitPort.open({ baudRate: 115200 });

        writer = microbitPort.writable.getWriter();

        console.log("Micro:bit connected!");
    } catch (err) {
        console.error("Failed to connect:", err);
    }
}



// ===== ฟังก์ชันส่งข้อความไป micro:bit =====
async function sendToMicrobit(text) {
    if (!writer) return;
    await writer.write(new TextEncoder().encode(text + "\n"));
}



// ===== เริ่มระบบทั้งหมด =====
async function init() {

    // เชื่อม micro:bit แค่ครั้งเดียว
    await connectMicrobit();

    const modelURL = "model/model.json";
    const metadataURL = "model/metadata.json";

    // โหลดโมเดล
    model = await tmImage.load(modelURL, metadataURL);

    // เปิดกล้อง
    webcam = new tmImage.Webcam(400, 400, true);
    await webcam.setup();
    await webcam.play();

    document.getElementById("webcam-container").appendChild(webcam.canvas);

    window.requestAnimationFrame(loop);
}



// ===== loop หลัก =====
async function loop() {
    webcam.update();

    const prediction = await model.predict(webcam.canvas);

    let best = prediction.reduce((a, b) =>
        a.probability > b.probability ? a : b
    );

    document.getElementById("label").innerText = best.className;

    // Debug ดูค่าความมั่นใจทั้งหมด
    console.log(prediction);

    // ส่งค่าเฉพาะเมื่อ confident และไม่ซ้ำกับค่าก่อนหน้า
    if (best.probability > 0.8 && best.className !== lastSent) {
        lastSent = best.className;
        await sendToMicrobit(best.className);
    }

    window.requestAnimationFrame(loop);
}


// เริ่มทำงาน
init();
