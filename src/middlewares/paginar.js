import RequicicaoIncorreta from "../erros/RequisicaoIncorreta.js"

async function paginar(req, res, next) {
    try {

        //Implementando paginação
        let { limite = 10, pagina = 1, ordenacao = "_id:-1" } = req.query

        let [campoOrdenacao, ordem] = ordenacao.split(":")

        limite = parseInt(limite)
        pagina = parseInt(pagina)
        ordem = parseInt(ordem)

        const resultado = req.resultado
        const totalResultado = req.resultado.clone()

        if (limite > 0 && pagina > 0) {

            // Conta o número total de documentos na coleção
            let total = await totalResultado.countDocuments();

            const resultadoPaginado = await resultado.find()
                .sort({ [campoOrdenacao]: ordem })
                .skip((pagina - 1) * limite)
                .limit(limite)
                .exec()

            res.status(200).json({
                results: resultadoPaginado,
                totalResults: total
            });
        } else {
            next(new RequicicaoIncorreta())
        }

    } catch (error) {
        next(error);
    }

}

export default paginar;