import RequicicaoIncorreta from "./RequisicaoIncorreta.js";

class ErroValidacao extends RequicicaoIncorreta {
    constructor(error) {
        const mensagensErro = Object.values(error.errors)
            .map(erro => erro.message)
            .join('; ');
            super(`Os seguintes erros foram encontrados: ${mensagensErro}`)
    }

}

export default ErroValidacao