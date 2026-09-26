const fs = require('fs');

function replaceInFile(path, bad, good) {
    let content = fs.readFileSync(path, 'utf8');
    if (content.includes(bad)) {
        content = content.split(bad).join(good);
        fs.writeFileSync(path, content, 'utf8');
        console.log('Fixed', bad, 'in', path);
    }
}

replaceInFile('admin.html', 'Ãšltimos', 'Últimos');
replaceInFile('admin.html', 'SECCIÃ“N', 'SECCIÓN');
replaceInFile('js/admin.js', 'â˜°', '☰');

