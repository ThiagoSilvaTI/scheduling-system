const API_URL = window.location.origin;

// Carregar serviços ao iniciar
async function carregarServicos() {
    try {
        const response = await fetch(`${API_URL}/api/servicos`);
        const servicos = await response.json();

        const selectServico = document.getElementById('servico');

        selectServico.innerHTML =
            '<option value="">Selecione um serviço</option>';

        servicos.forEach(servico => {
            const option = document.createElement('option');

            option.value = servico.id;

            option.textContent =
                `${servico.nome} - R$ ${Number(servico.preco).toFixed(2)} (${servico.duracao}min)`;

            selectServico.appendChild(option);
        });

    } catch (error) {
        console.error('Erro ao carregar serviços:', error);
    }
}

// Carregar horários disponíveis
async function carregarHorarios() {

    const data = document.getElementById('data').value;
    const servicoId = document.getElementById('servico').value;
    const selectHorario = document.getElementById('horario');

    if (!data || !servicoId) {

        selectHorario.disabled = true;

        selectHorario.innerHTML =
            '<option value="">Selecione primeiro a data e o serviço</option>';

        return;
    }

    try {

        const response = await fetch(
            `${API_URL}/api/horarios-disponiveis?data=${data}&servico_id=${servicoId}`
        );

        const horarios = await response.json();

        selectHorario.disabled = false;

        selectHorario.innerHTML =
            '<option value="">Selecione um horário</option>';

        if (horarios.length === 0) {

            selectHorario.innerHTML =
                '<option value="">Nenhum horário disponível nesta data</option>';

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

// Confirmar agendamento
document.getElementById('agendamentoForm')
.addEventListener('submit', async (e) => {

    e.preventDefault();

    const agendamento = {
        servico_id: parseInt(document.getElementById('servico').value),
        cliente_nome: document.getElementById('clienteNome').value,
        cliente_telefone: document.getElementById('clienteTelefone').value,
        data: document.getElementById('data').value,
        hora: document.getElementById('horario').value
    };

    try {

        const response = await fetch(
            `${API_URL}/api/agendamentos`,
            {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(agendamento)
            }
        );

        const resultado = await response.json();

        if (response.ok) {

            mostrarMensagem(
                `✅ ${resultado.message}\nCódigo: ${resultado.codigo}`,
                'sucesso'
            );

            document.getElementById('agendamentoForm').reset();

            document.getElementById('horario').disabled = true;

        } else {

            mostrarMensagem(`❌ ${resultado.error}`, 'erro');
        }

    } catch (error) {

        console.error(error);

        mostrarMensagem(
            '❌ Erro ao conectar com o servidor',
            'erro'
        );
    }
});

// Buscar histórico
async function buscarHistorico() {

    const telefone =
        document.getElementById('buscaTelefone').value;

    if (!telefone) {

        alert('Digite um telefone para buscar');
        return;
    }

    try {

        const response = await fetch(
            `${API_URL}/api/historico/${telefone}`
        );

        const agendamentos = await response.json();

        const historicoLista =
            document.getElementById('historicoLista');

        if (agendamentos.length === 0) {

            historicoLista.innerHTML =
                '<p style="text-align:center;color:#666;">Nenhum agendamento encontrado</p>';

            return;
        }

        historicoLista.innerHTML = agendamentos.map(ag => `

            <div class="card-agendamento ${ag.status === 'cancelado' ? 'cancelado' : ''}">

                <h3>${ag.servico_nome}</h3>

                <p>
                    <strong>Data:</strong>
                    ${formatarData(ag.data)}
                </p>

                <p>
                    <strong>Horário:</strong>
                    ${ag.hora}
                </p>

                <p>
                    <strong>Valor:</strong>
                    R$ ${Number(ag.preco).toFixed(2)}
                </p>

                <p>
                    <strong>Status:</strong>

                    <span class="status ${ag.status}">
                        ${ag.status === 'confirmado'
                            ? '✅ Confirmado'
                            : '❌ Cancelado'}
                    </span>
                </p>

                <p>
                    <small>
                        <strong>Código:</strong>
                        AG${ag.id}
                    </small>
                </p>

                ${ag.status === 'confirmado' &&
                new Date(ag.data) > new Date()

                    ? `<button
                        onclick="cancelarAgendamento(${ag.id})"
                        class="btn-cancelar">
                        Cancelar Agendamento
                    </button>`

                    : ''
                }

            </div>

        `).join('');

    } catch (error) {

        console.error('Erro ao buscar histórico:', error);
    }
}

// Cancelar agendamento
async function cancelarAgendamento(id) {

    if (!confirm('Tem certeza que deseja cancelar este agendamento?')) {
        return;
    }

    try {

        const response = await fetch(
            `${API_URL}/api/agendamentos/${id}`,
            {
                method: 'DELETE'
            }
        );

        if (response.ok) {

            alert('Agendamento cancelado com sucesso!');
            buscarHistorico();

        } else {

            alert('Erro ao cancelar agendamento');
        }

    } catch (error) {

        alert('Erro ao conectar com o servidor');
    }
}

// Funções auxiliares
function mostrarMensagem(msg, tipo) {

    const mensagemDiv =
        document.getElementById('mensagem');

    mensagemDiv.textContent = msg;
    mensagemDiv.className = `mensagem ${tipo}`;

    setTimeout(() => {

        mensagemDiv.textContent = '';
        mensagemDiv.className = 'mensagem';

    }, 5000);
}

function formatarData(data) {

    return new Date(data)
        .toLocaleDateString('pt-BR');
}

function showTab(tabId, event) {

    document.querySelectorAll('.tab-content')
        .forEach(tab => {
            tab.classList.remove('active');
        });

    document.querySelectorAll('.tab-btn')
        .forEach(btn => {
            btn.classList.remove('active');
        });

    document.getElementById(tabId)
        .classList.add('active');

    event.target.classList.add('active');
}

// Configurar data mínima
const hoje = new Date()
    .toISOString()
    .split('T')[0];

document.getElementById('data').min = hoje;

// Event listeners
document.getElementById('servico')
    .addEventListener('change', carregarHorarios);

document.getElementById('data')
    .addEventListener('change', carregarHorarios);

// Inicializar
carregarServicos();