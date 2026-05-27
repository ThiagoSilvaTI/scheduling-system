const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const db = require('./database');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, 'public')));

// Rotas da API

// Listar serviços
app.get('/api/servicos', (req, res) => {
  db.all('SELECT * FROM servicos WHERE ativo = 1', (err, rows) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    res.json(rows);
  });
});

// Buscar horários disponíveis
app.get('/api/horarios-disponiveis', (req, res) => {
  const { data, servico_id } = req.query;
  
  if (!data || !servico_id) {
    res.status(400).json({ error: 'Data e serviço são obrigatórios' });
    return;
  }

  // Buscar duração do serviço
  db.get('SELECT duracao FROM servicos WHERE id = ?', [servico_id], (err, servico) => {
    if (err || !servico) {
      res.status(500).json({ error: 'Serviço não encontrado' });
      return;
    }

    // Horários disponíveis (09:00 às 19:00)
    const todosHorarios = [];
    for (let hora = 9; hora <= 19; hora++) {
      for (let minuto = 0; minuto < 60; minuto += 30) {
        const horaStr = `${hora.toString().padStart(2, '0')}:${minuto.toString().padStart(2, '0')}`;
        todosHorarios.push(horaStr);
      }
    }

    // Buscar horários já agendados
    db.all(
      'SELECT hora FROM agendamentos WHERE data = ? AND status != "cancelado"',
      [data],
      (err, agendados) => {
        if (err) {
          res.status(500).json({ error: err.message });
          return;
        }

        const horariosOcupados = agendados.map(a => a.hora);
        const disponiveis = todosHorarios.filter(h => !horariosOcupados.includes(h));
        
        res.json(disponiveis);
      }
    );
  });
});

// Criar agendamento
app.post('/api/agendamentos', (req, res) => {
  const { servico_id, cliente_nome, cliente_telefone, data, hora } = req.body;
  
  if (!servico_id || !cliente_nome || !cliente_telefone || !data || !hora) {
    res.status(400).json({ error: 'Todos os campos são obrigatórios' });
    return;
  }

  // Verificar se horário ainda está disponível
  db.get(
    'SELECT id FROM agendamentos WHERE data = ? AND hora = ? AND status != "cancelado"',
    [data, hora],
    (err, existente) => {
      if (err) {
        res.status(500).json({ error: err.message });
        return;
      }
      
      if (existente) {
        res.status(409).json({ error: 'Horário já ocupado' });
        return;
      }

      // Criar agendamento
      db.run(
        `INSERT INTO agendamentos (servico_id, cliente_nome, cliente_telefone, data, hora, status)
         VALUES (?, ?, ?, ?, ?, 'confirmado')`,
        [servico_id, cliente_nome, cliente_telefone, data, hora],
        function(err) {
          if (err) {
            res.status(500).json({ error: err.message });
            return;
          }
          
          res.json({ 
            id: this.lastID,
            message: 'Agendamento confirmado com sucesso!',
            codigo: `AG${this.lastID}${Date.now()}`
          });
        }
      );
    }
  );
});

// Buscar histórico por telefone
app.get('/api/historico/:telefone', (req, res) => {
  const telefone = req.params.telefone;
  
  db.all(
    `SELECT a.*, s.nome as servico_nome, s.preco 
     FROM agendamentos a
     JOIN servicos s ON a.servico_id = s.id
     WHERE a.cliente_telefone = ?
     ORDER BY a.data DESC, a.hora DESC`,
    [telefone],
    (err, rows) => {
      if (err) {
        res.status(500).json({ error: err.message });
        return;
      }
      res.json(rows);
    }
  );
});

// Cancelar agendamento
app.delete('/api/agendamentos/:id', (req, res) => {
  const id = req.params.id;
  
  db.run('UPDATE agendamentos SET status = "cancelado" WHERE id = ?', [id], function(err) {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    res.json({ message: 'Agendamento cancelado com sucesso' });
  });
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`🚀 Servidor rodando na porta ${PORT}`);
});