//Config Node.js e Frameworks
const express = require("express");
const app = express();
const session = require('express-session');
const FileStore = require('session-file-store')(session);
const fs = require('fs');
const { engine } = require('express-handlebars');
const bodyparser = require('body-parser');
const Post = require('./models/post');
const Cadastro = require('./models/cadastro');
const Marca = require('./models/marca');
const PORT = 8081;
let id = 1;

// Config

//Funcão pra deixar letras maiusculas
function capitalizeFirstLetter(string) {
    return string.replace(/\b\w/g, match => match.toUpperCase());
}

//Template Engine
app.engine('handlebars', engine({
    defaultLayout: 'main', runtimeOptions: {
        allowProtoPropertiesByDefault: true,
        allowProtoMethodsByDefault: true
    }
}));
app.set('view engine', 'handlebars');

//body-parser
app.use(bodyparser.urlencoded({ extended: false }));
app.use(bodyparser.json());


//Verificar sessions
const sessionDir = './sessions';
if (!fs.existsSync(sessionDir)) {
    fs.mkdirSync(sessionDir);
}

//Definições sessão
app.use(session({
    store: new FileStore({ path: './sessions', logFn: function () { } }),
    secret: 'tomateverde6017',
    resave: false,
    saveUninitialized: true,
    cookie: { secure: false }
}));
app.use(express.urlencoded({ extended: true }));



//Funcões pra verificação

//Checar login
function checkAuth(req, res, next) {
    if (req.session.isAuthenticated) {
        next();
    }
}

//Verificar se login == login
app.post('/login', async (req, res) => {
    try {
        const { username, password } = req.body;
        const user = await Cadastro.findOne({ where: { usuario: username, senha: password } });
        if (user) {
            req.session.isAuthenticated = true;
            req.session.userId = user.id;
            Post.findAll()
                .then(function (posts) {
                    res.render('formulario', { msgCerveja: posts });
                });
        } else {
            res.render('menu', { msg: 'Login inválido' });
        }
    } catch (error) {
        console.error('Erro ao fazer login:', error);
        res.status(500).send('Erro ao fazer login');
    }
});


//Rotas


app.get('/', function (req, res) {
    res.render('menu');
});
//Renderizar o formulario
app.get('/home', function (req, res) {
    Post.findAll()
        .then(function (posts) {
            res.render('formulario', { msgCerveja: posts });
        })
});

//Renderizar o formulario de NOVO USUARIO
app.get('/novo-usuario', checkAuth, async (req, res) => {
    const idUsuario = req.session.userId;
    if (idUsuario == 1) {
        res.render('novoUsuario');
    }
    else {
        const post = await Post.findAll()
        res.render('formulario', { msgCadastro: 'Sem Permissão', msgCerveja: post });
    }
});

//Renderizar Cadastro de Cerveja
app.get('/cadastro-cerveja', checkAuth, async (req, res) => {
    const post = await Post.findAll()
    const idUsuario = req.session.userId;
    if (idUsuario === 1) {
        res.render('novaCerveja');
    }
    else {
        res.render('formulario', { msgPerm: 'Sem Permissão', msgCerveja: post });
    }

});

app.post('/nova-cerveja', checkAuth, async (req, res) => {

    const idUsuario = req.session.userId;
    const { cadastro, codigo, nome, marca } = req.body;
    console.log(marca);
    console.red


    if (idUsuario == 1) {
        if (cadastro == "cadastrar") {
            const cod = await Post.findOne({ where: { id: codigo } });
            const name = await Post.findOne({ where: { nome: nome } })
            if (cod != null || name != null) {
                res.render('novaCerveja', { msg: 'Cerveja já existe' })
            }
            else {
                const mensagemCapitalizada = capitalizeFirstLetter(nome);
                await Post.create({ id: codigo, nome: mensagemCapitalizada, quantidade: 0, Marca_ID: marca })
                res.render('novaCerveja', { msg: 'Cerveja cadastrada com sucesso' })
            }
        }

        else if (cadastro == 'excluir') {
            const cod = await Post.findOne({ where: { id: codigo } });
            const name = await Post.findOne({ where: { nome: nome } })
            if (cod != null && name != null) {
                await Post.destroy({ where: { id: codigo, nome: nome } })
                res.render('novaCerveja', { msg: 'Deletado com sucesso' })
            }
            else {
                res.render('novaCerveja', { msg: 'Cerveja não existe' })
            }

        }

    }
    else {
        const post = await Post.findAll()
        res.render('formulario', { msgPerm: 'Sem Permissão', msgCerveja: post });
    }
});


//Sair
app.get('/logout', (req, res) => {
    req.session.destroy(err => {
        if (err) {
            return res.render('formulario', { msg: 'error' });
        }
        res.render('menu');
    });
});

//Cadastro
app.post('/cadastro', checkAuth, async (req, res) => {
    const { cadastro, username, password } = req.body;

    if (cadastro == 'cadastro') {
        if (await Cadastro.findOne({ where: { usuario: username, senha: password } })) {
            res.render('novoUsuario', { msg: 'Usuário já existe' })
        }
        else {
            await Cadastro.create({ usuario: username, senha: password })
            res.render('novoUsuario', { msg: 'Novo usuário cadastrado' })
        }

    }
    else if (cadastro == 'excluir') {
        const user = await Cadastro.findOne({ where: { usuario: username, senha: password } });
        if (user && user.id !== 1) {
            if (await Cadastro.findOne({ where: { usuario: username, senha: password } })) {
                await Cadastro.destroy({ where: { usuario: username, senha: password } })
                    .then(() => {
                        res.render('novoUsuario', { msg: 'Login deletado' });
                    }).catch((error) => {
                        console.log("Erro ao Excluir");
                        res.render('novoUsuario', { msg: 'Login não existe' });
                    });
            }
            else {
                res.render('novoUsuario', { msg: 'Usuário não existe' });
            }
        }
        else {
            res.render('novoUsuario', { msg: 'Usuário não existe' })
        }
    }

}
);

//Operacoes
app.post('/operacao', checkAuth, async (req, res) => {
    const { action, estilo, tamanho, quant } = req.body;
    try {
        switch (action) {
            case 'consumo':
                const post = await Post.findOne({ where: { nome: estilo } });
                var novaQuant = post.quantidade - (tamanho * quant);
                if (novaQuant < 0) {
                    novaQuant = 0;
                }
                await Post.update({ quantidade: novaQuant }, { where: { nome: estilo } });
                res.redirect('/home');
                break;
            case 'adicionar':
                const post1 = await Post.findOne({ where: { nome: estilo } });
                const novaQuant1 = post1.quantidade + (tamanho * quant);
                await Post.update({ quantidade: novaQuant1 }, { where: { nome: estilo } });
                res.redirect('/home');
                break;
            case 'chegando':
                const novaQuant2 = (tamanho * quant);
                await Post.update({ quantidade: novaQuant2 }, { where: { nome: estilo } });
                res.redirect('/home');
                break;
            default:
                res.status(400).send('Ação desconhecida');
        }
    } catch (error) {
        console.error(error);
        res.status(500).send('Ocorreu um erro ao processar a operação');
    }
});

//Pesquisar a quantidade de cerveja
app.get('/pesquisar', checkAuth, async (req, res) => {
    const postCod = req.query.id;
    if (postCod == 1000) {
        const postGer = await Post.findAll();
        res.render('formulario', { postado: postGer, msgCerveja: postGer });

    }
    else {
        const postGer = await Post.findAll();
        const postSelect = await Post.findAll({where: {id: postCod}})
        const postEsp = await Post.findOne({ where: { id: postCod } })
        var codMarca = postEsp.Marca_ID;
        const marca = await Marca.findOne({ where: { ID: codMarca } })
        res.render('formulario', { postado: postSelect, msgCerveja: postGer, msgMarca: marca.Nome });

    }
});


//Verificação servidor
app.listen(8081, function () {
    console.log("Servidor Rodando Família");
}).on('error', function (err) {
    console.log("Erro ao iniciar o servidor:", err);
});

