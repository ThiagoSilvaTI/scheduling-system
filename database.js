const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.join(__dirname, 'agendamento.db');
const db = new sqlite3.Database(dbPath);

// Criar tabelas
db.serialize(() => {
  // Tabela de serviços
  db.run(`
    CREATE TABLE IF NOT EXISTS servicos (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      nome TEXT NOT NULL,
      duracao INTEGER NOT NULL,
      preco REAL NOT NULL,
      ativo INTEGER DEFAULT 1
    )
  `);

  // Tabela de agendamentos
  db.run(`
    CREATE TABLE IF NOT EXISTS agendamentos (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      servico_id INTEGER NOT NULL,
      cliente_nome TEXT NOT NULL,
      cliente_telefone TEXT NOT NULL,
      data DATE NOT NULL,
      hora TIME NOT NULL,
      status TEXT DEFAULT 'pendente',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY(servico_id) REFERENCES servicos(id)
    )
  `);

  // Inserir serviços de exemplo
  const servicosExemplo = [
    { nome: 'Corte de Cabelo', duracao: 30, preco: 35.00 },
    { nome: 'Barba', duracao: 20, preco: 25.00 },
    { nome: 'Corte + Barba', duracao: 50, preco: 55.00 },
    { nome: 'Sobrancelha', duracao: 15, preco: 15.00 },
    { nome: 'Platinado', duracao: 120, preco: 150.00 }
  ];

  servicosExemplo.forEach(servico => {
    db.run(`
      INSERT OR IGNORE INTO servicos (nome, duracao, preco)
      VALUES (?, ?, ?)
    `, [servico.nome, servico.duracao, servico.preco]);
  });
});

module.exports = db;