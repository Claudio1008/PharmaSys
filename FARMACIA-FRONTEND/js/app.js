const API_URL = "http://127.0.0.1:8000";
let listaMedicamentos = [];
let carrinho = [];

// ==========================================
// SEGURANÇA E LOGIN
// ==========================================

function alternarTelas(tela) {
    const blocoLogin = document.getElementById('bloco-login');
    const blocoRegistro = document.getElementById('bloco-registro');
    
    if (tela === 'registro') {
        blocoLogin.style.display = 'none';
        blocoRegistro.style.display = 'block';
    } else {
        blocoRegistro.style.display = 'none';
        blocoLogin.style.display = 'block';
    }
}

function getHeadersComToken() {
    const token = localStorage.getItem("token");
    return {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}` 
    };
}

async function registrarNovoUsuario(event) {
    event.preventDefault();
    const username = document.getElementById("reg-username").value;
    const password = document.getElementById("reg-password").value;

    try {
        const response = await fetch(`${API_URL}/registrar`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ username, password })
        });

        if (response.ok) {
            alert("✅ Cadastro realizado com sucesso!");
            document.getElementById("form-registro").reset();
            alternarTelas('login');
        } else {
            const data = await response.json();
            alert("❌ Erro: " + data.detail);
        }
    } catch (e) { alert("Erro de conexão."); }
}

async function fazerLogin(event) {
    event.preventDefault();
    const formData = new URLSearchParams();
    formData.append("username", document.getElementById("login-username").value);
    formData.append("password", document.getElementById("login-password").value);

    try {
        const response = await fetch(`${API_URL}/login`, {
            method: "POST",
            body: formData
        });

        if (response.ok) {
            const data = await response.json();
            localStorage.setItem("token", data.access_token);
            iniciarSistema();
        } else {
            document.getElementById("login-erro").style.display = "block";
        }
    } catch (e) { alert("Erro ao conectar."); }
}

function iniciarSistema() {
    document.getElementById("tela-login").style.display = "none";
    document.getElementById("myTab").style.display = "flex";
    document.getElementById("myTabContent").style.display = "block";
    document.getElementById("btn-sair").style.display = "block";
    
    carregarMedicamentos();
    carregarHistorico();
}

function fazerLogout() {
    localStorage.removeItem("token");
    window.location.reload();
}

// ==========================================
// SISTEMA DE FARMÁCIA (ESTOQUE E PDV)
// ==========================================

async function carregarMedicamentos() {
    try {
        const res = await fetch(`${API_URL}/medicamentos/`, { headers: getHeadersComToken() });
        if (res.status === 401) return fazerLogout();
        
        listaMedicamentos = await res.json();
        const tbody = document.getElementById("tabelaEstoque");
        const select = document.getElementById("select-medicamento");
        
        tbody.innerHTML = "";
        select.innerHTML = '<option value="">Selecione...</option>';

        listaMedicamentos.forEach(med => {
            tbody.innerHTML += `
                <tr>
                    <td>${med.id}</td>
                    <td class="fw-bold">${med.nome}</td>
                    <td>${med.fabricante}</td>
                    <td class="text-success">R$ ${med.preco.toFixed(2)}</td>
                    <td><span class="badge ${med.estoque > 5 ? 'bg-primary' : 'bg-danger'}">${med.estoque}</span></td>
                    <td>${med.receita_obrigatoria ? 'Sim' : 'Não'}</td>
                </tr>`;
            
            if(med.estoque > 0) {
                select.innerHTML += `<option value="${med.id}">${med.nome} (R$ ${med.preco.toFixed(2)})</option>`;
            }
        });
    } catch (e) { console.error(e); }
}

function adicionarAoCarrinho() {
    const id = document.getElementById("select-medicamento").value;
    const qtd = parseInt(document.getElementById("input-qtd").value);
    const med = listaMedicamentos.find(m => m.id == id);

    if (!med || qtd < 1) return alert("Selecione um item válido.");
    if (qtd > med.estoque) return alert("Estoque insuficiente.");

    carrinho.push({
        medicamento_id: med.id,
        nome: med.nome,
        quantidade: qtd,
        preco: med.preco,
        subtotal: med.preco * qtd
    });

    atualizarCarrinho();
}

function atualizarCarrinho() {
    const tbody = document.getElementById("tabelaCarrinho");
    let total = 0;
    tbody.innerHTML = "";

    carrinho.forEach((item, index) => {
        total += item.subtotal;
        tbody.innerHTML += `
            <tr>
                <td>${item.nome}</td>
                <td>${item.quantidade}</td>
                <td>R$ ${item.subtotal.toFixed(2)}</td>
                <td><button class="btn btn-sm btn-outline-danger" onclick="carrinho.splice(${index},1);atualizarCarrinho()"><i class="fa-solid fa-trash"></i></button></td>
            </tr>`;
    });

    document.getElementById("totalVenda").innerText = total.toFixed(2);
}

async function finalizarVenda() {
    if (carrinho.length === 0) return alert("Carrinho vazio!");

    try {
        const res = await fetch(`${API_URL}/vendas/`, {
            method: "POST",
            headers: getHeadersComToken(),
            body: JSON.stringify({ itens: carrinho })
        });

        if (res.ok) {
            alert("🚀 Venda Finalizada!");
            carrinho = [];
            atualizarCarrinho();
            carregarMedicamentos();
            carregarHistorico();
        }
    } catch (e) { alert("Erro ao vender."); }
}

async function carregarHistorico() {
    try {
        const res = await fetch(`${API_URL}/vendas/`, { headers: getHeadersComToken() });
        const vendas = await res.json();
        const tbody = document.getElementById("tabelaVendas");
        tbody.innerHTML = "";

        vendas.forEach(v => {
            tbody.innerHTML += `
                <tr>
                    <td class="fw-bold">#${v.id}</td>
                    <td>${new Date(v.data_venda).toLocaleString()}</td>
                    <td>${v.itens.length} itens</td>
                    <td class="text-success fw-bold">R$ ${v.total.toFixed(2)}</td>
                </tr>`;
        });
    } catch (e) { console.error(e); }
}

// Persistência de Sessão
window.onload = () => {
    if (localStorage.getItem("token")) iniciarSistema();
};

