async function uploadFile() {
    const fileInput = document.getElementById('fileInput');
    const file = fileInput.files[0];
    const btn = document.getElementById('uploadBtn');
    const loader = document.getElementById('loader');
    const resultDiv = document.getElementById('result');

    if (!file) return alert("Please select a file.");
    if (file.size > 1024 * 1024) return alert("File too big! Max 1MB.");

    // UI Updates
    btn.disabled = true;
    loader.classList.remove('hidden');
    resultDiv.classList.add('hidden');

    const formData = new FormData();
    formData.append('secretFile', file);

    try {
        const response = await fetch('/api/upload', {
            method: 'POST',
            body: formData
        });

        const data = await response.json();

        if (response.ok) {
            document.getElementById('linkOutput').value = data.url;
            resultDiv.classList.remove('hidden');
        } else {
            alert("Error: " + (data.error || "Upload failed"));
        }
    } catch (err) {
        console.error(err);
        alert("Connection failed.");
    } finally {
        btn.disabled = false;
        loader.classList.add('hidden');
    }
}

function copyLink() {
    const copyText = document.getElementById("linkOutput");
    copyText.select();
    document.execCommand("copy");
    alert("Copied!");
}
