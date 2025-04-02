function adicionarClienteId(req, res, next) {
    if (!req.usuario || !req.usuario.clienteId) {
        return res.status(403).json({ message: "Cliente não identificado." });
    }

    // Adiciona o filtro para as consultas
    req.filtroCliente = { clienteId: req.usuario.clienteId };

    next();
}

export default adicionarClienteId;
