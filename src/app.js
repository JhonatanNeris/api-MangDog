import express from 'express'
import conectaNaDatabase from './config/dbConnect.js'
import routes from './routes/index.js'
import cors from 'cors';
import mongoose from 'mongoose';


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

app.use((error, req, res, next) => {
    if (error instanceof mongoose.Error.CastError) {
        res.status(400).send({ message: `Um ou mais dados fornecidos estão incorretos!` });
    } else {
        res.status(500).json({ message: ` ${error.message} - Erro interno de servidor!` });
    }

})


export default app;