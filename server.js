const express = require('express');
const path = require('path');
const fs = require('fs');
const app = express();
const PORT = 6969;

app.use(express.json());

app.use(express.static(path.join(__dirname, 'public')));

app.use('/images', express.static(path.join(__dirname, 'images')));

app.use('/fonts', express.static(path.join(__dirname, 'fonts')));

app.use('/script', express.static(path.join(__dirname, 'public', 'client', 'script')));

app.use('/styles', express.static(path.join(__dirname, 'public', 'client', 'styles')));


app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public/client/index.html'));
});

app.get('/index.html', (req, res) => {
  res.sendFile(path.join(__dirname, 'public/client/index.html'));
});

app.get('/perfil.html', (req, res) => {
  res.sendFile(path.join(__dirname, 'public/client/perfil.html'));
});

app.get('/empezar-lavado.html', (req, res) => {
  res.sendFile(path.join(__dirname, 'public/client/empezar-lavado.html'));
});

app.get('/categorias-lavados.html', (req, res) => {
  res.sendFile(path.join(__dirname, 'public/client/categorias-lavados.html'));
});

app.get('/escaner.html', (req, res) => {
  res.sendFile(path.join(__dirname, 'public/client/escaner.html'));
});

app.get('/historial.html', (req, res) => {
  res.sendFile(path.join(__dirname, 'public/client/historial.html'));
});

app.get('/lavado-personalizado.html', (req, res) => {
  res.sendFile(path.join(__dirname, 'public/client/lavado-personalizado.html'));
});


// Ruta POST para guardar lavado
app.post('/guardar-lavado', (req, res) => {
  const nuevoLavado = req.body;

  fs.readFile(path.join(__dirname, 'lavados.json'), 'utf8', (err, data) => {
    if (err) return res.status(500).send('Error al leer archivo');

    let lavados = JSON.parse(data);
    lavados.unshift(nuevoLavado);
    lavados = lavados.slice(0, 20);

    fs.writeFile(path.join(__dirname, 'lavados.json'), JSON.stringify(lavados, null, 2), (err) => {
      if (err) return res.status(500).send('Error al guardar');
      res.send('Lavado guardado correctamente');
    });
  });
});

// Ruta GET para mostrar los últimos lavados
app.get('/ultimos-lavados', (req, res) => {
  fs.readFile(path.join(__dirname, 'lavados.json'), 'utf8', (err, data) => {
    if (err) return res.status(500).send('Error al leer archivo');
    const lavados = JSON.parse(data).slice(0, 3);
    res.json(lavados);
  });
});

app.listen(PORT, () => {
  console.log(`Servidor corriendo en http://localhost:${PORT}`);
});
