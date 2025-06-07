let currentFileIndex = 0;
let pdfFiles = [];
const pdfViewer = document.getElementById("pdfViewer");
const fileNameDisplay = document.getElementById("fileName");
const prevBtn = document.getElementById("prevBtn");
const nextBtn = document.getElementById("nextBtn");
const inputsContainer = document.getElementById("inputsContainer");

document
    .getElementById("pdfUpload")
    .addEventListener("change", function (event) {
        pdfFiles = Array.from(event.target.files);
        inputsContainer.innerHTML = "";

        if (pdfFiles.length > 0) {
            pdfFiles.forEach((file, index) => {
                const wrapper = document.createElement("div");
                wrapper.className = "input-wrapper";

                const label = document.createElement("label");
                label.textContent = `#${index + 1}`;

                const input = document.createElement("input");
                input.type = "text";
                input.dataset.index = index;
                input.addEventListener("keydown", function (e) {
                    if (e.key === "Enter") {
                        e.preventDefault();
                        if (currentFileIndex < pdfFiles.length - 1) {
                            currentFileIndex++;
                            displayPDF(pdfFiles[currentFileIndex]);
                            updateButtons();
                            scrollToInput(currentFileIndex);
                        }
                    }
                });

                wrapper.appendChild(label);
                wrapper.appendChild(input);
                inputsContainer.appendChild(wrapper);
            });

            currentFileIndex = 0;
            displayPDF(pdfFiles[currentFileIndex]);
            updateButtons();
            scrollToInput(currentFileIndex);
        }
    });

prevBtn.addEventListener("click", () => {
    if (currentFileIndex > 0) {
        currentFileIndex--;
        displayPDF(pdfFiles[currentFileIndex]);
        updateButtons();
        scrollToInput(currentFileIndex);
    }
});

nextBtn.addEventListener("click", () => {
    if (currentFileIndex < pdfFiles.length - 1) {
        currentFileIndex++;
        displayPDF(pdfFiles[currentFileIndex]);
        updateButtons();
        scrollToInput(currentFileIndex);
    }
});

function updateButtons() {
    const currentFile = pdfFiles[currentFileIndex];
    const fileURL = URL.createObjectURL(currentFile);
    const fileLink = document.getElementById("fileLink");

    fileLink.textContent = currentFile.name;
    fileLink.href = fileURL;

    prevBtn.disabled = currentFileIndex === 0;
    nextBtn.disabled = currentFileIndex === pdfFiles.length - 1;
}

function displayPDF(file) {
    const fileReader = new FileReader();
    fileReader.onload = function () {
        const typedarray = new Uint8Array(this.result);
        pdfjsLib.getDocument(typedarray).promise.then(function (pdf) {
            pdfViewer.innerHTML = ""; // Clear cũ

            const screenHeight = window.innerHeight - 60;

            const renderPage = (pageNum) => {
                return pdf.getPage(pageNum).then((page) => {
                    const viewport = page.getViewport({ scale: 1 });
                    const scale = screenHeight / viewport.height;
                    const scaledViewport = page.getViewport({ scale });

                    const canvas = document.createElement("canvas");
                    const context = canvas.getContext("2d");
                    canvas.width = scaledViewport.width;
                    canvas.height = scaledViewport.height;

                    return page
                        .render({
                            canvasContext: context,
                            viewport: scaledViewport,
                        })
                        .promise.then(() => {
                            pdfViewer.appendChild(canvas);
                        });
                });
            };

            // Render tất cả các trang
            const renderPromises = [];
            for (let i = 1; i <= pdf.numPages; i++) {
                renderPromises.push(renderPage(i));
            }

            return Promise.all(renderPromises);
        });
    };
    fileReader.readAsArrayBuffer(file);
}

function Copy() {
    const values = [...inputsContainer.querySelectorAll("input")].map((input) =>
        input.value.trim()
    );
    const combinedText = values.join("\n");
    navigator.clipboard.writeText(combinedText).then(() => {
        alert("Đã sao chép nội dung:\n\n" + combinedText);
    });
}

function scrollToInput(index) {
    const input = inputsContainer.querySelector(`input[data-index="${index}"]`);
    if (input) input.focus();
}
