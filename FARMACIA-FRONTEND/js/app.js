// app.js - Lógica de conexão e funcionamento do Front-end

const API_URL = "http://127.0.0.1:8000";
let carrinho = [];

// Inicializa o sistema buscando os dados quando a página carrega
window.onload = function() {
    carregarMedicamentos();
    carregarVendas();
};

// ==========================
// MÓDULO: MEDICAMENTOS
// ==========================
async function carregarMedicamentos() {
    try {
        const response = await fetch(`${API_URL}/medicamentos/`);
        const medicamentos = await response.json();
        
        const tabela = document.getElementById("tabelaMedicamentos");
        const select = document.getElementById("selectMedicamentoVenda");
        
        tabela.innerHTML = "";
        select.innerHTML = '<option value="">-- Escolha --</option>';

        medicamentos.forEach(med => {
            const tr = document.createElement("tr");
            tr.innerHTML = `
                <td><span class="badge bg-secondary">#${med.id}</span></td>
                <td class="fw-bold">${med.nome}</td>
                <td>${med.fabricante}</td>
                <td class="text-success fw-bold">R$ ${med.preco.toFixed(2)}</td>
                <td>${med.estoque > 0 ? med.estoque : '<span class="text-danger">Sem estoque</span>'}</td>
                <td>${med.receita_obrigatoria ? '<span class="badge bg-danger">Sim</span>' : '<span class="badge bg-success">Não</span>'}</td>
            `;
            tabela.appendChild(tr);

            if(med.estoque > 0) {
                select.innerHTML += `<option value="${med.id}" data-preco="${med.preco}" data-nome="${med.nome}">
                    ${med.nome} - R$ ${med.preco.toFixed(2)} (Estoque: ${med.estoque})
                </option>`;
            }
        });
    } catch (error) {
        console.error("Erro ao carregar medicamentos:", error);
    }
}

async function cadastrarMedicamento(event) {
    event.preventDefault();
    
    const medData = {
        nome: document.getElementById("nome").value,
        fabricante: document.getElementById("fabricante").value,
        preco: parseFloat(document.getElementById("preco").value),
        estoque: parseInt(document.getElementById("estoqueQtd").value),
        receita_obrigatoria: document.getElementById("receita").checked
    };

    try {
        const response = await fetch(`${API_URL}/medicamentos/`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(medData)
        });

        if (response.ok) {
            alert("✅ Medicamento cadastrado com sucesso!");
            document.getElementById("formMedicamento").reset();
            carregarMedicamentos(); 
        } else {
            alert("❌ Erro ao cadastrar.");
        }
    } catch (error) {
        alert("❌ Erro de conexão.");
    }
}

// ==========================
// MÓDULO: VENDAS (CARRINHO)
// ==========================
function adicionarAoCarrinho() {
    const select = document.getElementById("selectMedicamentoVenda");
    const inputQtd = document.getElementById("quantidadeVenda");
    
    const medId = select.value;
    const qtd = parseInt(inputQtd.value);

    if (!medId || qtd <= 0) {
        alert("Selecione um medicamento e uma quantidade válida.");
        return;
    }

    const option = select.options[select.selectedIndex];
    const nome = option.getAttribute("data-nome");
    const preco = parseFloat(option.getAttribute("data-preco"));

    carrinho.push({
        medicamento_id: parseInt(medId),
        nome: nome,
        quantidade: qtd,
        preco_unitario: preco,
        subtotal: preco * qtd
    });

    atualizarCarrinhoHTML();
    inputQtd.value = 1;
    select.value = "";
}

function atualizarCarrinhoHTML() {
    const lista = document.getElementById("listaCarrinho");
    const spanTotal = document.getElementById("totalVenda");
    lista.innerHTML = "";
    let total = 0;

    if(carrinho.length === 0) {
        lista.innerHTML = '<li class="list-group-item text-muted text-center">O carrinho está vazio</li>';
        spanTotal.innerText = "0.00";
        return;
    }

    carrinho.forEach((item, index) => {
        total += item.subtotal;
        lista.innerHTML += `
            <li class="list-group-item d-flex justify-content-between align-items-center">
                <div>
                    <strong>${item.quantidade}x ${item.nome}</strong><br>
                    <small class="text-muted">R$ ${item.preco_unitario.toFixed(2)} cada</small>
                </div>
                <div class="d-flex align-items-center">
                    <span class="badge bg-success rounded-pill me-3">R$ ${item.subtotal.toFixed(2)}</span>
                    <button class="btn btn-sm btn-outline-danger" onclick="removerDoCarrinho(${index})"><i class="fa-solid fa-trash"></i></button>
                </div>
            </li>
        `;
    });
    spanTotal.innerText = total.toFixed(2);
}

function removerDoCarrinho(index) {
    carrinho.splice(index, 1);
    atualizarCarrinhoHTML();
}

async function finalizarVenda() {
    if (carrinho.length === 0) {
        alert("O carrinho está vazio!");
        return;
    }

    const itensVenda = carrinho.map(item => ({
        medicamento_id: item.medicamento_id,
        quantidade: item.quantidade
    }));

    try {
        const response = await fetch(`${API_URL}/vendas/`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ itens: itensVenda })
        });

        if (response.ok) {
            alert("🛒 Venda finalizada com sucesso!");
            carrinho = [];
            atualizarCarrinhoHTML();
            carregarMedicamentos(); 
            carregarVendas();       
        } else {
            const errorData = await response.json();
            alert("❌ Erro na venda: " + errorData.detail);
        }
    } catch (error) {
        alert("❌ Erro de conexão.");
    }
}

// ==========================
// MÓDULO: HISTÓRICO DE VENDAS
// ==========================
async function carregarVendas() {
    try {
        const response = await fetch(`${API_URL}/vendas/`);
        if(!response.ok) return; 

        const vendas = await response.json();
        const tabela = document.getElementById("tabelaVendas");
        tabela.innerHTML = "";

        vendas.forEach(venda => {
            const dataFormatada = new Date(venda.data_venda).toLocaleString('pt-BR');
            const tr = document.createElement("tr");
            tr.innerHTML = `
                <td><span class="badge bg-primary">#${venda.id}</span></td>
                <td>${dataFormatada}</td>
                <td>${venda.itens.length} itens</td>
                <td class="text-success fw-bold">R$ ${venda.total.toFixed(2)}</td>
            `;
            tabela.appendChild(tr);
        });
    } catch (error) {
        console.log("Erro ao buscar histórico de vendas.");
    }
}