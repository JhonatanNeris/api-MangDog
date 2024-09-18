import express from 'express'
import conectaNaDatabase from './config/dbConnect.js'
import routes from './routes/index.js'
import cors from 'cors';
import manipuladorDeErros from './middlewares/manipuladorDeErros.js'
import manipulador404 from './middlewares/manipulador404.js';


const conexao = await conectaNaDatabase()

conexao.on('error', (error) => {
    console.error('Erro de conexão', error)
})

conexao.once('open', () => {
    console.log('Conexão com o banco feita com sucesso.')
})

const app = express()

// O middleware CORS aqui permite todas as origens
app.use(cors()); 

routes(app)

//middleware de Rota 404
app.use(manipulador404)

//middleware de erro
app.use(manipuladorDeErros)

export default app;