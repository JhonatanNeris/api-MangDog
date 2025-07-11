export function mapearPedidoIfoodParaIPedido(pedidoIfood, clienteId) {
  const itens = pedidoIfood.items.map((item) => ({
    nome: item.name,
    obs: item.observations,
    preco: item.unitPrice,
    quantidade: item.quantity,
    precoTotal: item.totalPrice,
    complementos: item.options?.map((opt) => ({
      nome: opt.name,
      quantidade: opt.quantity,
      preco: opt.price,
    })) || [],
  }));

  const pagamentos = pedidoIfood.payments.methods.map((p) => ({
    valor: p.value,
    tipo: mapearMetodoPagamento(p.method, p.type),
    status: p.prepaid ? 'pago' : 'pendente',
  }));

  return {
    clienteId: clienteId,
    origem: 'ifood',
    idExterno: pedidoIfood.id,
    nomeCliente: pedidoIfood.customer?.name || 'Cliente iFood',
    tipo: mapearTipoPedido(pedidoIfood.orderType),
    status: 'novo',
    itens: itens,
    valorTotal: pedidoIfood.total.orderAmount,
    pagamentos: pagamentos,
    horario: new Date(pedidoIfood.createdAt),
  };
}

function mapearMetodoPagamento(metodo, tipo) {
  if (metodo === 'CASH') return 'dinheiro';
  if (metodo === 'CREDIT' && tipo === 'ONLINE') return 'credito-online';
  if (metodo === 'PIX') return 'pix';
  return 'cartao';
}

function mapearTipoPedido(orderType) {
  if (orderType === 'DELIVERY') return 'entrega';
  if (orderType === 'TAKEOUT') return 'retirada';
  return 'comer aqui';
}

