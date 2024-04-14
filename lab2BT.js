const fs = require('fs');
const path = require('path');
const { promisify } = require('util');

const readdir = promisify(fs.readdir);
const stat = promisify(fs.stat);
const rename = promisify(fs.rename);
const mkdir = promisify(fs.mkdir);

async function sortFiles(directory) {
  // định nghĩa các file có đuôi j sẽ vào folder nào
    const folders = {
        "offices": [".doc", ".docx", ".xls", ".xlsx", ".ppt", ".pptx"],
        "apps": [".exe", ".msi"],
        "images": [".jpg", ".png", ".gif", ".jpeg", ".bmp"],
        "medias": [".mp4", ".mkv", ".mp3", ".wav"],
        "texts": [".txt"]
    };

    // Tạo các thư mục nếu chúng chưa tồn tại
    await Promise.all(Object.keys(folders).map(folderName => mkdir(path.join(directory, folderName), { recursive: true })));

    // Tạo danh sách các phần tử của "others"
    const otherExtensions = [];
    Object.values(folders).forEach(extList => {
        extList.forEach(ext => {
            otherExtensions.push(ext);
        });
    });

    // Di chuyển các tệp vào các thư mục tương ứng
    const files = await readdir(directory);
    await Promise.all(files.map(async filename => {
        if (filename !== "others") {
            const filePath = path.join(directory, filename);
            const fileStat = await stat(filePath);
            if (fileStat.isFile()) {
                for (const [folderName, extensions] of Object.entries(folders)) {
                    if (extensions.some(ext => filename.toLowerCase().endsWith(ext))) {
                        await rename(filePath, path.join(directory, folderName, filename));
                        return;
                    }
                }
                // Nếu không phù hợp với bất kỳ loại nào, di chuyển vào thư mục 'others'
                if (!otherExtensions.some(ext => filename.toLowerCase().endsWith(ext))) {
                    await rename(filePath, path.join(directory, "others", filename));
                }
            }
        }
    }));
}

// Sử dụng hàm sortFiles với đường dẫn thư mục được nhập từ bàn phím
async function main() {
    const readline = require('readline').createInterface({
        input: process.stdin,
        output: process.stdout
    });

    readline.question('Nhập đường dẫn thư mục cần sắp xếp: ', async (directory) => {
        await sortFiles(directory);
        console.log("Sắp xếp file thành công!");
        readline.close();
    });
}

main().catch(err => console.error(err));
