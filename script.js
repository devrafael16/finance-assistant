// ====== Elementos do DOM =====
const btnAbrirModal = document.querySelector('#btn-abrir-modal')
const btnFecharModal = document.querySelector('#btn-fechar-modal')
const modalOverlay = document.querySelector('#modal-overlay')
const formTransacao = document.querySelector('#form-transacao')
const selectTipo = document.querySelector('#tipo')
const camposFixa = document.querySelector('#campos-fixa')
const camposParcelada = document.querySelector('#campos-parcelada')
const camposEntrada = document.querySelector('#campos-entrada')
const tabelaCorpo = document.querySelector('#tabela-corpo')
const totalEntradas = document.querySelector('#total-entradas')
const totalSaidas = document.querySelector('#total-saidas')
const saldoTotal = document.querySelector('#saldo-total')

// ===== Modal e formulário =====
function alternarModal() {
    modalOverlay.classList.toggle('ativo')
}

btnAbrirModal.addEventListener('click', alternarModal)
btnFecharModal.addEventListener('click', alternarModal)
// Mostra só o bloco de campos do tipo escolhido e esconde os outros
selectTipo.addEventListener('change', function(){
    const tipo = selectTipo.value

    if (tipo === 'fixa') {
        camposFixa.style.display = 'block'
        camposParcelada.style.display = 'none'
        camposEntrada.style.display = 'none'
    } else if (tipo === 'parcelada') {
        camposFixa.style.display = 'none'
        camposParcelada.style.display = 'block'
        camposEntrada.style.display = 'none'
    } else if (tipo === 'entrada') {
        camposEntrada.style.display = 'block'
        camposParcelada.style.display = 'none'
        camposFixa.style.display = 'none'
    }
})

// ===== Dados e localStorage =====
// Carrega as transações salvas; se não houver nada (null), começa com lista vazia
const transacoes = JSON.parse(localStorage.getItem('transacoes')) || []

// Continua a numeração a partir do maior id salvo, para não repetir ids ao recarregar
const listaIds = transacoes.map(function(t) {return t.id})

const maiorId = Math.max(...listaIds)

let contadorId = transacoes.length === 0 ? 0 : maiorId + 1

// Converte o array em texto (JSON) e guarda no navegador
function salvarLocalStorage() {
    localStorage.setItem('transacoes', JSON.stringify(transacoes))
}

// ===== Renderização =====
function renderizarTabela() {
    tabelaCorpo.innerHTML = ''

    transacoes.forEach(function(transacao) {
        const linha = document.createElement('tr')

        // Entrada não tem parcela nem vencimento, por isso usa uma linha mais simples
        if (transacao.tipo === 'entrada') {
            linha.innerHTML = `
            <td>${transacao.descricao}</td>
            <td>R$ ${transacao.valor.toFixed(2)}</td>
            <td>-</td>
            <td>-</td>
            <td>Entrada</td>
            <td><button class="btn-excluir" data-id="${transacao.id}">Excluir</button></td>
            `
        } else {
        const valorParcela = transacao.valor / transacao.parcelas
        // Fixa mostra "-"; parcelada mostra o valor da parcela e (parcela atual/total)
        linha.innerHTML = `
        <td>${transacao.descricao}</td>
        <td>R$ ${transacao.valor.toFixed(2)}</td>
        <td>${transacao.tipo === 'fixa' ? '-' : `R$ ${valorParcela.toFixed(2)} (${transacao.parcelaAtual}/${transacao.parcelas})`}</td>
        <td>Dia ${transacao.vencimento}</td>
        <td>${transacao.tipo === 'fixa' ? 'Fixa' : 'Parcelada'}</td>
        <td><button class="btn-excluir" data-id="${transacao.id}">Excluir</button></td>
        `
        }
        tabelaCorpo.appendChild(linha)
    })
}

// Atualiza os cards de resumo quando qualquer transação for adicionada ou excluida
function atualizarResumo() {
    let entradas = 0
    let saidas = 0

    transacoes.forEach(function(transacao) {
        if (transacao.tipo === 'fixa') {
            saidas += transacao.valor
        } else if (transacao.tipo === 'parcelada') {
            saidas += transacao.valor
        } else if (transacao.tipo === 'entrada') {
            entradas += transacao.valor
        }
    })

    totalEntradas.textContent = 'R$ ' + entradas.toFixed(2)
    totalSaidas.textContent = 'R$ ' + saidas.toFixed(2)
    saldoTotal.textContent = 'R$ ' + (entradas - saidas).toFixed(2)
}

// ===== Cadastro e exclusão ======
// O clique é escutado na tabela toda, porque os botões são criados pelo JS.
// O data-id do botão diz qual transação apagar
tabelaCorpo.addEventListener('click', function(event) {
    if (event.target.classList.contains('btn-excluir')) {
        const id = parseInt(event.target.dataset.id)
        // findIndex acha a posição pelo id; splice remove 1 item nessa posição
        const index = transacoes.findIndex(function(t) {
            return t.id === id
        })
        transacoes.splice(index, 1)
        salvarLocalStorage()
        renderizarTabela()
        atualizarResumo()
    }
})

formTransacao.addEventListener('submit', function(event) {
    // preventDefault evita que a página recarregue ao enviar o formulário
    event.preventDefault()
    const tipo = selectTipo.value

    if (tipo === 'fixa') {
        const descricaoFixa = document.querySelector('#descricao-fixa').value
        const valorFixa = parseFloat(document.querySelector('#valor-fixa').value)
        const diaVencimento = parseInt(document.querySelector('#dia-vencimento').value)

        const transacao = {
            id: contadorId++,
            tipo: 'fixa',
            descricao: descricaoFixa,
            valor: valorFixa,
            vencimento: diaVencimento
        }
        transacoes.push(transacao)
        salvarLocalStorage()

        renderizarTabela()
        atualizarResumo()
        // Fecha o modal, limpa o formulário e esconde os blocos de campos
        alternarModal()
        formTransacao.reset()
        camposFixa.style.display = 'none'
        camposParcelada.style.display = 'none'
        camposEntrada.style.display = 'none'

    } else if (tipo === 'parcelada') {
        const descricaoParcelada = document.querySelector('#descricao-parcelada').value
        const valorParcelada = parseFloat(document.querySelector('#valor-parcelada').value)
        const dataCompra = document.querySelector('#data-compra').value
        const parcelas = parseInt(document.querySelector('#parcelas').value)
        const vencimentoCartao = parseInt(document.querySelector('#vencimento-cartao').value)

        const transacao = {
            id: contadorId++,
            tipo: 'parcelada',
            descricao: descricaoParcelada,
            valor: valorParcelada,
            data: dataCompra,
            parcelas: parcelas,
            parcelaAtual : 1,
            vencimento: vencimentoCartao
        }
        transacoes.push(transacao)
        salvarLocalStorage()

        renderizarTabela()
        atualizarResumo()
        alternarModal()
        formTransacao.reset()
        camposFixa.style.display = 'none'
        camposParcelada.style.display = 'none'
        camposEntrada.style.display = 'none'

    } else if (tipo === 'entrada'){
        const descricaoEntrada = document.querySelector('#descricao-entrada').value
        const valorEntrada = parseFloat(document.querySelector('#valor-entrada').value)

        const transacao = {
            id: contadorId++,
            tipo: 'entrada',
            descricao: descricaoEntrada,
            valor: valorEntrada
        }
        transacoes.push(transacao)
        salvarLocalStorage()

        renderizarTabela()
        atualizarResumo()
        alternarModal()
        formTransacao.reset()
        camposFixa.style.display = 'none'
        camposParcelada.style.display = 'none'
        camposEntrada.style.display = 'none'
    }


})

// ===== Início =====
// Ao abrir a página, desenha na tela os dados que vieram do localStorage
renderizarTabela()
atualizarResumo()
