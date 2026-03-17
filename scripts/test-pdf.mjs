import fs from 'fs';
import pdf from 'pdf-parse';

let dataBuffer = fs.readFileSync('templates /заявка Интеллект.PDF');

pdf(dataBuffer).then(function (data) {
    console.log(data.text);
}).catch(function (err) {
    console.error(err);
});
