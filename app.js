import puppeteer from "puppeteer";
import fs from "fs";
import { Parser as Json2csvParser } from "json2csv";
import XLSX from "xlsx";

async function obtenerDatosAngular() {
    const navegador = await puppeteer.launch({
        headless: false,
        slowMo: 500
    });

    const pagina = await navegador.newPage();
    await pagina.goto('https://blog.angular.dev/');

    const datos = await pagina.evaluate(() => {
        const arregloResultados = [];
        const articulos = document.querySelectorAll('article');

        articulos.forEach(article => {
            const titulo = article.querySelector('div>div>div>div>div>div>div>div>a>h2')?.innerText;
            const texto = article.querySelector('div>div>div>div>div>div>div>div>a>div>h3')?.innerText;
            const avatar = article.querySelector('div>div>div>div>div>div>div>div>div>div>div>a>div>img')?.currentSrc;
            const nombre = article.querySelector('div>div>div>div>div>div>div>div>div>div>div>a>p')?.innerText;

            const fechaLikesComentarios = article.querySelector('div>div>div>div>div>div>div>div>div>div>span>div>div')?.innerText?.split('\n') || [];
            const fecha = fechaLikesComentarios[0] || null;
            const likes = fechaLikesComentarios[1] || null;
            const comentarios = fechaLikesComentarios[2] || null;

            const objetoResultado = {
                Articulo: {
                    titulo: titulo,
                    texto: texto,
                    autor: {
                        avatar: avatar,
                        nombre: nombre
                    },
                    fecha: fecha,
                    reacciones: {
                        likes: likes,
                        comentarios: comentarios
                    }
                }
            };

            arregloResultados.push(objetoResultado);
        });

        return arregloResultados;
    });

    console.log(':::datos:::', JSON.stringify(datos, null, 2));

    fs.writeFileSync("angular.json", JSON.stringify(datos, null, 2), "utf-8");

    const datosPlano = datos.map(d => ({
        titulo: d.Articulo.titulo,
        texto: d.Articulo.texto,
        autor_avatar: d.Articulo.autor.avatar,
        autor_nombre: d.Articulo.autor.nombre,
        fecha: d.Articulo.fecha,
        likes: d.Articulo.reacciones.likes,
        comentarios: d.Articulo.reacciones.comentarios
    }));

    const json2csvParser = new Json2csvParser({ fields: Object.keys(datosPlano[0]) });
    const csv = json2csvParser.parse(datosPlano);
    fs.writeFileSync("angular.csv", csv, "utf-8");

    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet(datosPlano);
    XLSX.utils.book_append_sheet(wb, ws, "Articulos");
    XLSX.writeFile(wb, "angular.xlsx");

    await navegador.close();
}

obtenerDatosAngular();
