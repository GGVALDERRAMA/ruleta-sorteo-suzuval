const fs = require('fs');
const glob = require('fs').readdirSync;

function fixFile(path) {
    let content = fs.readFileSync(path, 'utf8');
    
    // Diccionario de caracteres corrompidos
    const fixes = {
        'Ã¡': 'á',
        'Ã©': 'é',
        'Ã­': 'í',
        'Ã³': 'ó',
        'Ãº': 'ú',
        'Ã±': 'ñ',
        'Â¿': '¿',
        'Â¡': '¡',
        'Ã\x81': 'Á',
        'Ã\x89': 'É',
        'Ã\x8D': 'Í',
        'Ã\x93': 'Ó',
        'Ã\x9A': 'Ú',
        'Ã\x91': 'Ñ'
    };
    
    let changed = false;
    for (const [bad, good] of Object.entries(fixes)) {
        if (content.includes(bad)) {
            content = content.split(bad).join(good);
            changed = true;
        }
    }
    
    if (changed) {
        fs.writeFileSync(path, content, 'utf8');
        console.log('Fixed', path);
    }
}

['admin.html', 'js/admin.js', 'js/api.js', 'js/ruleta.js'].forEach(fixFile);
