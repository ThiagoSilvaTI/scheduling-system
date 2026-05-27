const API_URL = window.location.origin;

async function carregarServicos() {
    try {
        const response = await fetch(`${API_URL}/api/servicos`);
        const servicos = await response.json();
        const selectServico = document.getElementById('servico');
        
        selectServico.innerHTML = '<option value="">SELECIONE UM SERVIÇO</option>';
        
        servicos.forEach(servico => {
            const option = document.createElement('option');
            option.value = servico.id;
            option.textContent = `${servico.nome} • R$ ${Number(servico.preco).toFixed(2)} • ${servico.duracao}min`;
            selectServico.appendChild(option);
        });
    } catch (error) {
        console.error('Erro ao carregar serviços:', error);
    }
}

async function carregarHorarios() {
    const data = document.getElementById('data').value;
    const servicoId = document.getElementById('servico').value;
    const selectHorario = document.getElementById('horario');
    
    if (!data || !servicoId) {
        selectHorario.disabled = true;
        selectHorario.innerHTML = '<option value="">SELECIONE PRIMEIRO A DATA</option>';
        return;
    }
    
    try {
        const response = await fetch(`${API_URL}/api/horarios-disponiveis?data=${data}&servico_id=${servicoId}`);
        const horarios = await response.json();
        
        selectHorario.disabled = false;
        selectHorario.innerHTML = '<option value="">SELECIONE UM HORÁRIO</option>';
        
        if (horarios.length === 0) {
            selectHorario.innerHTML = '<option value="">NENHUM HORÁRIO DISPONÍVEL</option>';
            return;
        }
        
        horarios.forEach(horario => {
            const option = document.createElement('option');
            option.value = horario;
            option.textContent = horario;
            selectHorario.appendChild(option);
        });
    } catch (error) {
        console.error('Erro ao carregar horários:', error);
    }
}

document.getElementById('agendamentoForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const agendamento = {
        servico_id: parseInt(document.getElementById('servico').value),
        cliente_nome: document.getElementById('clienteNome').value,
        cliente_telefone: document.getElementById('clienteTelefone').value,
        data: document.getElementById('data').value,
        hora: document.getElementById('horario').value
    };
    
    try {
        const response = await fetch(`${API_URL}/api/agendamentos`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(agendamento)
        });
        
        const resultado = await response.json();
        
        if (response.ok) {
            mostrarMensagem(`AGENDAMENTO CONFIRMADO! Código: ${resultado.codigo}`, 'sucesso');
            document.getElementById('agendamentoForm').reset();
            document.getElementById('horario').disabled = true;
            document.getElementById('horario').innerHTML = '<option value="">SELECIONE PRIMEIRO A DATA</option>';
        } else {
            mostrarMensagem(`ERRO: ${resultado.error}`, 'erro');
        }
    } catch (error) {
        console.error(error);
        mostrarMensagem('ERRO AO CONECTAR COM O SERVIDOR', 'erro');
    }
});

async function buscarHistorico() {
    const telefone = document.getElementById('buscaTelefone').value;
    
    if (!telefone) {
        alert('DIGITE UM TELEFONE PARA BUSCAR');
        return;
    }
    
    try {
        const response = await fetch(`${API_URL}/api/historico/${telefone}`);
        const agendamentos = await response.json();
        const historicoLista = document.getElementById('historicoLista');
        
        if (agendamentos.length === 0) {
            historicoLista.innerHTML = '<div style="text-align:center; padding:40px; color:#666;">NENHUM AGENDAMENTO ENCONTRADO</div>';
            return;
        }
        
        historicoLista.innerHTML = agendamentos.map(ag => `
            <div class="card-agendamento ${ag.status === 'cancelado' ? 'cancelado' : ''}">
                <h3>${ag.servico_nome}</h3>
                <p>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <rect x="3" y="4" width="18" height="18" rx="2" stroke="#D4AF37" stroke-width="1.5"/>
                        <path d="M3 10H21" stroke="#D4AF37" stroke-width="1.5"/>
                    </svg>
                    <strong>DATA:</strong> ${formatarData(ag.data)}
                </p>
                <p>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <circle cx="12" cy="12" r="10" stroke="#D4AF37" stroke-width="1.5"/>
                        <path d="M12 6V12L16 14" stroke="#D4AF37" stroke-width="1.5" stroke-linecap="round"/>
                    </svg>
                    <strong>HORÁRIO:</strong> ${ag.hora}
                </p>
                <p>
                    <strong>VALOR:</strong> R$ ${Number(ag.preco).toFixed(2)}
                </p>
                <p>
                    <strong>STATUS:</strong>
                    <span class="status ${ag.status}">
                        ${ag.status === 'confirmado' ? 'CONFIRMADO' : 'CANCELADO'}
                    </span>
                </p>
                <p><small><strong>CÓDIGO:</strong> AG${ag.id}</small></p>
                ${ag.status === 'confirmado' && new Date(ag.data) > new Date() ? `
                    <button onclick="cancelarAgendamento(${ag.id})" class="btn-cancelar">
                        CANCELAR AGENDAMENTO
                    </button>
                ` : ''}
            </div>
        `).join('');
    } catch (error) {
        console.error('Erro ao buscar histórico:', error);
    }
}

async function cancelarAgendamento(id) {
    if (!confirm('TEM CERTEZA QUE DESEJA CANCELAR ESTE AGENDAMENTO?')) return;
    
    try {
        const response = await fetch(`${API_URL}/api/agendamentos/${id}`, { method: 'DELETE' });
        
        if (response.ok) {
            alert('AGENDAMENTO CANCELADO COM SUCESSO!');
            buscarHistorico();
        } else {
            alert('ERRO AO CANCELAR AGENDAMENTO');
        }
    } catch (error) {
        alert('ERRO AO CONECTAR COM O SERVIDOR');
    }
}

function mostrarMensagem(msg, tipo) {
    const mensagemDiv = document.getElementById('mensagem');
    mensagemDiv.textContent = msg;
    mensagemDiv.className = `mensagem ${tipo}`;
    
    setTimeout(() => {
        mensagemDiv.textContent = '';
        mensagemDiv.className = 'mensagem';
    }, 5000);
}

function formatarData(data) {
    return new Date(data).toLocaleDateString('pt-BR');
}

function showTab(tabId, event) {
    document.querySelectorAll('.tab-content').forEach(tab => {
        tab.classList.remove('active');
    });
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    document.getElementById(tabId).classList.add('active');
    event.target.classList.add('active');
}

// Configurar data mínima
const hoje = new Date();
hoje.setHours(0, 0, 0, 0);
document.getElementById('data').min = hoje.toISOString().split('T')[0];

// Event listeners
document.getElementById('servico').addEventListener('change', carregarHorarios);
document.getElementById('data').addEventListener('change', carregarHorarios);

// Inicializar
carregarServicos();