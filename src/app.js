import express from 'express'
import conectaNaDatabase from './config/dbConnect.js'
import routes from './routes/index.js'
import cors from 'cors';


const conexao = await conectaNaDatabase()

conexao.on('error', (error) => {
    console.error('Erro de conexão', error)
})

conexao.once('open', () => {
    console.log('Conexão com o banco feita com sucesso.')
})

const app = express()

// O middleware CORS aqui
// Permite todas as origens
app.use(cors()); 

routes(app)


export default app;