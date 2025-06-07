let currentFileIndex = 0;
let pdfFiles = [];
const pdfViewer = document.getElementById("pdfViewer");
const fileNameDisplay = document.getElementById("fileName");
const prevBtn = document.getElementById("prevBtn");
const nextBtn = document.getElementById("nextBtn");
const inputsContainer = document.getElementById("inputsContainer");
const inputSearch = document.getElementById("searchFile");
document
    .getElementById("pdfUpload")
    .addEventListener("change", function (event) {
        pdfFiles = Array.from(event.target.files);
        inputsContainer.innerHTML = "";

        if (pdfFiles.length > 0) {
            pdfFiles.forEach((file, index) => {
                const wrapper = document.createElement("div");
                wrapper.className = "input-wrapper";
                wrapper.style.display = "flex";
                wrapper.style.alignItems = "center";
                wrapper.style.gap = "10px";

                // Số thứ tự
                const label = document.createElement("label");
                label.textContent = `#${index + 1}`;

                // Ô input
                const input = document.createElement("input");
                input.type = "text";
                input.dataset.index = index;
                input.style.flex = "1";

                // Khi nhấn Enter: chuyển sang file tiếp theo
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

                // ✅ Checkbox
                const checkbox = document.createElement("input");
                checkbox.type = "checkbox";
                checkbox.className = "done-checkbox";
                checkbox.title = "Không áp dụng start/end with";

                wrapper.appendChild(label);
                wrapper.appendChild(input);
                wrapper.appendChild(checkbox);
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
        scrollToInput(currentFileIndex);
    }
});

function updateButtons() {
    const currentFile = pdfFiles[currentFileIndex];
    const fileURL = URL.createObjectURL(currentFile);
    const fileLink = document.getElementById("fileLink");

    fileLink.textContent = currentFile.name;
    fileLink.href = fileURL;

    // Chỉ bật nút nếu không ở đầu/cuối danh sách
    prevBtn.disabled = currentFileIndex === 0;
    nextBtn.disabled = currentFileIndex === pdfFiles.length - 1;
}

function displayPDF(file) {
    pdfViewer.innerHTML = "<p>Đang tải PDF...</p>";

    const fileReader = new FileReader();
    fileReader.onload = function () {
        prevBtn.disabled = true;
        nextBtn.disabled = true;
        inputSearch.disabled = true;

        const typedarray = new Uint8Array(this.result);
        pdfjsLib
            .getDocument(typedarray)
            .promise.then(function (pdf) {
                pdfViewer.innerHTML = "";

                const screenHeight = window.innerHeight - 60;

                const renderPage = (pageNum) => {
                    return pdf.getPage(pageNum).then((page) => {
                        const viewport = page.getViewport({ scale: 1.3 });
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

                // Render tất cả các trang PDF
                const renderPromises = [];
                for (let i = 1; i <= pdf.numPages; i++) {
                    renderPromises.push(renderPage(i));
                }

                return Promise.all(renderPromises).then(() => {
                    // Bật lại nút điều hướng sau khi render xong
                    updateButtons();
                    inputSearch.disabled = false;
                    window.scrollTo({ top: 0, behavior: "smooth" });
                });
            })
            .catch(function (err) {
                pdfViewer.innerHTML =
                    "<p style='color:red;'>Không thể hiển thị file PDF này.</p>";
                console.error("Lỗi khi hiển thị PDF:", err);
            });
    };

    fileReader.readAsArrayBuffer(file);
}

function XoaInput() {
    const inputs = inputsContainer.querySelectorAll("input[type='text']");
    inputs.forEach((i) => (i.value = ""));
}

function Copy() {
    const values = [
        ...document.querySelectorAll("#inputsContainer .input-wrapper"),
    ].map((wrapper) => {
        const input = wrapper.querySelector('input[type="text"]');
        const checkbox = wrapper.querySelector(".done-checkbox");
        let value = input.value.trim();

        // Chỉ sao chép nếu checkbox được tick
        if (!checkbox.checked) {
            return (
                document.getElementById("startWith").value +
                input.value.trim() +
                document.getElementById("endWith").value
            );
        }

        return value;
    });

    const combinedText = values.join("\n");
    navigator.clipboard.writeText(combinedText).then(() => {
        alert("Đã sao chép nội dung:\n\n" + combinedText);
    });
}

function scrollToInput(index) {
    const input = inputsContainer.querySelector(`input[data-index="${index}"]`);
    if (input) input.focus();
}

const resizer = document.getElementById("resizer");
const box = document.getElementById("inputsContainer");

resizer.addEventListener("mousedown", (e) => {
    e.preventDefault();

    function onMouseMove(e) {
        const newWidth = box.getBoundingClientRect().right - e.clientX;
        if (newWidth > 250) {
            box.parentElement.style.width = newWidth + "px";
        }
    }

    function onMouseUp() {
        document.removeEventListener("mousemove", onMouseMove);
        document.removeEventListener("mouseup", onMouseUp);
    }

    document.addEventListener("mousemove", onMouseMove);
    document.addEventListener("mouseup", onMouseUp);
});

inputSearch.addEventListener("change", (e) => {
    const index = parseInt(e.target.value);
    if (!isNaN(index) && index >= 1 && index <= pdfFiles.length) {
        currentFileIndex = index - 1;
        displayPDF(pdfFiles[currentFileIndex]);
        updateButtons();
        scrollToInput(currentFileIndex);
    }
});

document
    .getElementById("CountPages")
    .addEventListener("click", async function (event) {
        if (pdfFiles.length === 0) return;

        const pageCounts = await countPages();

        const inputs = inputsContainer.querySelectorAll("input[type=text]");
        inputs.forEach((input, index) => {
            input.value = `${pageCounts[index]}`;
        });
    });

async function countPages() {
    const results = [];
    for (let i = 0; i < pdfFiles.length; i++) {
        const file = pdfFiles[i];
        const arrayBuffer = await file.arrayBuffer();
        const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
        results.push(pdf.numPages);
    }
    return results;
}
